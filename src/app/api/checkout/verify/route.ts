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
        await db
          .update(schema.orders)
          .set({
            status: "paid",
            paidAt: new Date(),
          })
          .where(eq(schema.orders.paystackReference, reference));
      } catch (err) {
        console.warn("DB order status update notice:", err);
      }
    }

    // Update in-memory order
    const memOrder = inMemoryStore.orders.get(reference);
    if (memOrder) {
      memOrder.status = isSuccessful ? "paid" : "failed";
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
