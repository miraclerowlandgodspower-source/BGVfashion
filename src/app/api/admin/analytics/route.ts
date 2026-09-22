import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { checkAdminApiAccess } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const [orders, payments, products, users, visitors, orderItems] = await Promise.all([
      db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)),
      db.select().from(schema.payments).orderBy(desc(schema.payments.createdAt)),
      db.select().from(schema.products),
      db.select().from(schema.users),
      db.select().from(schema.visitorAnalytics),
      db.select().from(schema.orderItems),
    ]);
    const successfulPayments = payments.filter((payment) => payment.status === "success");
    const activeCutoff = Date.now() - 5 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const topProducts = Object.values(orderItems.reduce<Record<string, { productName: string; quantity: number; revenue: number }>>((result, item) => {
      const current = result[item.productId] || { productName: item.productName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.totalPrice;
      result[item.productId] = current;
      return result;
    }, {})).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const statusCounts = orders.reduce<Record<string, number>>((result, order) => { result[order.status] = (result[order.status] || 0) + 1; return result; }, {});
    const recentActivity = [
      ...orders.slice(0, 8).map((order) => ({ type: "order", label: `${order.orderNumber} · ${order.status}`, amount: order.totalAmount, createdAt: order.createdAt })),
      ...payments.slice(0, 8).map((payment) => ({ type: "payment", label: `${payment.reference} · ${payment.status}`, amount: payment.amount, createdAt: payment.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
    return NextResponse.json({ success: true, data: {
      orders: orders.length,
      revenue: successfulPayments.reduce((sum, payment) => sum + payment.amount, 0),
      products: products.length,
      visitors: visitors.length,
      activeVisitors: visitors.filter((visitor) => visitor.lastActivityAt.getTime() >= activeCutoff).length,
      visitorsToday: visitors.filter((visitor) => visitor.createdAt >= todayStart).length,
      pendingOrders: orders.filter((order) => ["pending", "payment_confirmed", "processing"].includes(order.status)).length,
      completedOrders: orders.filter((order) => order.status === "delivered").length,
      paymentSuccesses: successfulPayments.length,
      paymentFailures: payments.filter((payment) => payment.status === "failed").length,
      customers: users.length,
      statusCounts,
      topProducts,
      recentActivity,
    } });
  } catch (error) {
    console.error("Admin analytics query failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load analytics." }, { status: 500 });
  }
}
