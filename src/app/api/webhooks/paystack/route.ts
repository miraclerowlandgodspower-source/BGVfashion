import { NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderReceiptEmails } from "@/lib/order-email";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    const rawBody = await req.text();

    if (!signature || !verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn("Invalid Paystack webhook signature received.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const db = getDb();

      if (db) {
        try {
          const orderRows = await db
            .select()
            .from(schema.orders)
            .where(eq(schema.orders.paystackReference, reference))
            .limit(1);

          if (orderRows.length > 0) {
            const ord = orderRows[0];
            const amountMatches = Math.round((event.data.amount || 0) / 100) === ord.totalAmount && (event.data.currency || "NGN") === ord.currency;
            if (!amountMatches) {
              console.warn("Rejected Paystack webhook with an amount or currency mismatch.");
              return NextResponse.json({ error: "Payment does not match order." }, { status: 400 });
            }
            await db.update(schema.orders).set({ status: "payment_confirmed", paymentStatus: "paid", paidAt: new Date(event.data.paid_at || Date.now()), paystackTransactionId: String(event.data.id || "") }).where(eq(schema.orders.paystackReference, reference));
            await db
              .insert(schema.payments)
              .values({
                orderId: ord.id,
                reference,
                provider: "Paystack",
                amount: event.data.amount ? Math.round(event.data.amount / 100) : ord.totalAmount,
                currency: event.data.currency || "NGN",
                status: "success",
                channel: event.data.channel || "card",
                cardType: event.data.authorization?.card_type || null,
                paidAt: new Date(event.data.paid_at || Date.now()),
                rawResponse: event.data as any,
              })
              .onConflictDoNothing();
            if (!ord.receiptSentAt) {
              const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, ord.id));
              const sent = await sendOrderReceiptEmails({ ...ord, status: "payment_confirmed", paymentStatus: "paid", paystackTransactionId: String(event.data.id || ""), createdAt: ord.createdAt.toISOString() } as any, items as any, String(event.data.id || ""));
              if (sent) await db.update(schema.orders).set({ receiptSentAt: new Date() }).where(eq(schema.orders.id, ord.id));
            }
          }
        } catch (dbErr) {
          console.warn("Webhook DB update error:", dbErr);
        }
      }

      const memOrder = inMemoryStore.orders.get(reference);
      if (memOrder) {
        memOrder.status = "payment_confirmed";
        memOrder.paymentStatus = "paid";
        memOrder.paidAt = event.data.paid_at || new Date().toISOString();
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
