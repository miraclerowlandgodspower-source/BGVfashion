import { NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderReceiptEmails } from "@/lib/order-email";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Payment reference is required." },
        { status: 400 }
      );
    }

    const db = getDb();
    let orderRows: any[] = [];
    if (db) {
      try {
        orderRows = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.paystackReference, reference))
          .limit(1);
      } catch (err) {
        console.warn("Payment order lookup failed:", err);
      }
    }

    const paystackVerification = await verifyPaystackTransaction(reference);
    const isSuccessful = paystackVerification.data.status === "success";
    const order = orderRows[0];
    const verifiedAmount = Math.round((paystackVerification.data.amount || 0) / 100);
    const amountMatches = !!order && verifiedAmount === order.totalAmount && (paystackVerification.data.currency || "NGN") === order.currency;
    const paymentAccepted = isSuccessful && amountMatches;
    let verifiedOrder: any = null;

    if (db && order) {
      try {
        if (!paymentAccepted) {
          await db.insert(schema.payments).values({ orderId: order.id, reference, provider: "Paystack", amount: verifiedAmount || order.totalAmount, currency: paystackVerification.data.currency || order.currency, status: "failed", rawResponse: paystackVerification.data as any }).onConflictDoNothing();
          return NextResponse.json({ success: false, error: "Payment verification did not match the order amount or currency." }, { status: 400 });
        }

        await db
          .update(schema.orders)
          .set({
            status: "payment_confirmed",
            paymentStatus: "paid",
            paidAt: new Date(),
            paystackTransactionId: String(paystackVerification.data.id || ""),
          })
          .where(eq(schema.orders.paystackReference, reference));

        await db.insert(schema.payments).values({ orderId: order.id, reference, provider: "Paystack", amount: verifiedAmount, currency: paystackVerification.data.currency || "NGN", status: "success", paidAt: new Date(paystackVerification.data.paid_at || Date.now()), rawResponse: paystackVerification.data as any }).onConflictDoNothing();

        const itemRows = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
        const receiptOrder = {
          ...order,
          status: "payment_confirmed",
          paymentStatus: "paid",
          paidAt: new Date().toISOString(),
          paystackTransactionId: String(paystackVerification.data.id || ""),
          createdAt: order.createdAt.toISOString(),
        } as any;
        if (!order.receiptSentAt) {
          const sent = await sendOrderReceiptEmails(receiptOrder, itemRows as any, String(paystackVerification.data.id || ""));
          if (sent) await db.update(schema.orders).set({ receiptSentAt: new Date() }).where(eq(schema.orders.id, order.id));
        }
        verifiedOrder = { ...receiptOrder, items: itemRows };
      } catch (err) {
        console.warn("DB order status update notice:", err);
      }
    }

    // Update in-memory order
    const memOrder = inMemoryStore.orders.get(reference);
    if (memOrder) {
      memOrder.status = paymentAccepted ? "payment_confirmed" : "pending";
      memOrder.paymentStatus = paymentAccepted ? "paid" : "failed";
      memOrder.paidAt = paymentAccepted ? new Date().toISOString() : null;
      memOrder.paystackTransactionId = paymentAccepted ? String(paystackVerification.data.id || "") : null;
      if (paymentAccepted) await sendOrderReceiptEmails(memOrder, memOrder.items || [], String(paystackVerification.data.id || ""));
    }

    return NextResponse.json({
      success: paymentAccepted,
      data: {
        reference,
        status: paymentAccepted ? "paid" : "failed",
        order: memOrder || verifiedOrder || null,
      },
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
