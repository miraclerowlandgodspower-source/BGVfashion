import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { checkAdminApiAccess } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const rows = await db.select().from(schema.payments).orderBy(desc(schema.payments.createdAt));
    const payments = await Promise.all(rows.map(async (payment) => {
      const order = await db.select({ orderNumber: schema.orders.orderNumber, customerName: schema.orders.customerName, customerEmail: schema.orders.customerEmail, paystackTransactionId: schema.orders.paystackTransactionId, createdAt: schema.orders.createdAt }).from(schema.orders).where(eq(schema.orders.id, payment.orderId)).limit(1);
      return { ...payment, transactionId: order[0]?.paystackTransactionId || (payment.rawResponse as any)?.id || null, order: order[0] || null };
    }));
    return NextResponse.json({ success: true, data: { payments } });
  } catch (error) {
    console.error("Admin payments query failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load payments." }, { status: 500 });
  }
}
