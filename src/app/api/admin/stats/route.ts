import { NextResponse } from "next/server";
import { getDb, inMemoryStore, getProducts } from "@/lib/db";
import * as schema from "@/db/schema";

export async function GET() {
  try {
    const products = await getProducts();
    const db = getDb();

    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let customersCount = inMemoryStore.users.size;
    let unreadMessages = 0;

    if (db) {
      try {
        const orderRows = await db.select().from(schema.orders);
        totalOrders = orderRows.length;
        totalRevenue = orderRows
          .filter((o) => o.status === "paid" || o.status === "delivered")
          .reduce((sum, o) => sum + o.totalAmount, 0);
        pendingOrders = orderRows.filter((o) => o.status === "pending" || o.status === "paid").length;

        const userRows = await db.select().from(schema.users);
        customersCount = userRows.length;

        const convRows = await db.select().from(schema.chatConversations);
        unreadMessages = convRows.length;
      } catch (err) {
        console.warn("DB stats error:", err);
      }
    }

    if (totalOrders === 0) {
      const memOrders = Array.from(inMemoryStore.orders.values());
      totalOrders = memOrders.length;
      totalRevenue = memOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      pendingOrders = memOrders.length;
      unreadMessages = inMemoryStore.chatConversations.size;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        productsCount: products.length,
        customersCount,
        unreadMessages,
        atelierLocation: "Ojo, Lagos, Nigeria",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
