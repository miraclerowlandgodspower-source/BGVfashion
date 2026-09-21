import { NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

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

    const paystackVerification = await verifyPaystackTransaction(reference);
    const isSuccessful = paystackVerification.data.status === "success";

    const db = getDb();
    if (db && isSuccessful) {
      try {
        const orderRows = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.paystackReference, reference))
          .limit(1);

        await db
          .update(schema.orders)
          .set({
            status: "payment_confirmed",
            paymentStatus: "paid",
            paidAt: new Date(),
          })
          .where(eq(schema.orders.paystackReference, reference));

        if (orderRows.length > 0) {
          const ord = orderRows[0];
          await db
            .insert(schema.payments)
            .values({
              orderId: ord.id,
              reference,
              provider: "Paystack",
              amount: paystackVerification.data.amount ? Math.round(paystackVerification.data.amount / 100) : ord.totalAmount,
              currency: paystackVerification.data.currency || "NGN",
              status: "success",
              paidAt: new Date(paystackVerification.data.paid_at || Date.now()),
              rawResponse: paystackVerification.data as any,
            })
            .onConflictDoNothing();
        }
      } catch (err) {
        console.warn("DB order status update notice:", err);
      }
    }

    // Update in-memory order
    const memOrder = inMemoryStore.orders.get(reference);
    if (memOrder) {
      memOrder.status = isSuccessful ? "payment_confirmed" : "pending";
      memOrder.paymentStatus = isSuccessful ? "paid" : "failed";
      memOrder.paidAt = isSuccessful ? new Date().toISOString() : null;
    }

    return NextResponse.json({
      success: isSuccessful,
      data: {
        reference,
        status: isSuccessful ? "paid" : "pending",
        order: memOrder || null,
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
