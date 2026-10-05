import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { sendOrderReceiptEmails } from "@/lib/order-email";

function isValidBachsSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.BACHS_WEBHOOK_SECRET || "";
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const received = signature.trim().replace(/^sha256=/i, "");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!isValidBachsSignature(rawBody, req.headers.get("x-bachs-signature"))) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.type !== "collection.succeeded") {
      return NextResponse.json({ received: true });
    }

    const collection = event.data || {};
    const orderNumber = collection.reference || collection.metadata?.orderNumber;
    if (!orderNumber) return NextResponse.json({ error: "Missing order reference." }, { status: 400 });

    const db = getDb();
    if (db) {
      const rows = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).limit(1);
      if (rows.length) {
        const ord = rows[0];
        const expectedUsd = Number(collection.metadata?.expectedUsd || 0);
        const receivedAmount = Number(collection.amount || 0);
        const receivedCurrency = String(collection.currency || "").toUpperCase();

        if (expectedUsd > 0 && (receivedCurrency !== "USD" || Math.abs(receivedAmount - expectedUsd) > 0.009)) {
          return NextResponse.json({ error: "Payment does not match order." }, { status: 400 });
        }

        const paymentReference = String(collection.collection_id || collection.id || event.id || orderNumber);
        await db.update(schema.orders).set({
          status: "payment_confirmed",
          paymentStatus: "paid",
          paidAt: new Date(),
          trackingStatus: "Payment Confirmed",
        }).where(eq(schema.orders.id, ord.id));

        await db.insert(schema.payments).values({
          orderId: ord.id,
          reference: paymentReference,
          provider: "Bachs",
          amount: ord.totalAmount,
          currency: ord.currency,
          status: "success",
          channel: String(collection.payment_method || collection.method || "bachs"),
          paidAt: new Date(),
          rawResponse: collection as any,
        }).onConflictDoNothing();

        if (!ord.receiptSentAt) {
          const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, ord.id));
          const sent = await sendOrderReceiptEmails(
            { ...ord, status: "payment_confirmed", paymentStatus: "paid", createdAt: ord.createdAt.toISOString() } as any,
            items as any,
            paymentReference
          );
          if (sent) await db.update(schema.orders).set({ receiptSentAt: new Date() }).where(eq(schema.orders.id, ord.id));
        }
      }
    }

    const memOrder = inMemoryStore.orders.get(orderNumber);
    if (memOrder) {
      memOrder.status = "payment_confirmed";
      memOrder.paymentStatus = "paid";
      memOrder.paidAt = new Date().toISOString();
      memOrder.trackingStatus = "Payment Confirmed";
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Bachs webhook failed:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
