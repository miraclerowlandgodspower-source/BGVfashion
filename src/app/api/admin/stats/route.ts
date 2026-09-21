import { NextResponse } from "next/server";
import { getDb, inMemoryStore, getProducts } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const products = await getProducts({ includeInactive: true });
    const db = getDb();

    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let customersCount = inMemoryStore.users.size;
    let unreadMessages = 0;
    let recentOrders: any[] = [];
    let recentMessages: any[] = [];

    // Low stock products (stock quantity <= 5)
    const lowStockProducts = products.filter((p) => (p.stockQuantity ?? 10) <= 5);

    if (db) {
      try {
        const orderRows = await db
          .select()
          .from(schema.orders)
          .orderBy(desc(schema.orders.createdAt));

        totalOrders = orderRows.length;
        totalRevenue = orderRows
          .filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "payment_confirmed")
          .reduce((sum, o) => sum + o.totalAmount, 0);

        pendingOrders = orderRows.filter(
          (o) => o.status === "pending" || o.status === "paid" || o.status === "payment_confirmed" || o.status === "processing"
        ).length;

        completedOrders = orderRows.filter((o) => o.status === "delivered").length;

        recentOrders = orderRows.slice(0, 5);

        const userRows = await db.select().from(schema.users);
        customersCount = userRows.length;

        const convRows = await db
          .select()
          .from(schema.chatConversations)
          .orderBy(desc(schema.chatConversations.updatedAt));

        unreadMessages = convRows.filter((c) => (c.status || "open") === "open").length;
        recentMessages = convRows.slice(0, 5);
      } catch (err) {
        console.warn("DB stats query notice (using fallback store):", err);
      }
    }

    if (totalOrders === 0 && inMemoryStore.orders.size > 0) {
      const memOrders = Array.from(inMemoryStore.orders.values());
      // Unique by orderNumber
      const uniqueOrders: any[] = [];
      const seen = new Set();
      for (const o of memOrders) {
        if (!seen.has(o.orderNumber)) {
          seen.add(o.orderNumber);
          uniqueOrders.push(o);
        }
      }

      totalOrders = uniqueOrders.length;
      totalRevenue = uniqueOrders
        .filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "payment_confirmed")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      pendingOrders = uniqueOrders.filter(
        (o) => o.status === "pending" || o.status === "paid" || o.status === "payment_confirmed" || o.status === "processing"
      ).length;

      completedOrders = uniqueOrders.filter((o) => o.status === "delivered").length;
      recentOrders = uniqueOrders.slice(0, 5);
      unreadMessages = inMemoryStore.chatConversations.size;
      recentMessages = Array.from(inMemoryStore.chatConversations.values()).slice(0, 5);
    }

    const atelierLocation = inMemoryStore.settings.get("atelier_location") || "Ojo, Lagos, Nigeria";
    const storeName = inMemoryStore.settings.get("store_name") || "BGV Fashion Atelier";

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        productsCount: products.length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 8),
        customersCount,
        unreadMessages,
        recentOrders,
        recentMessages,
        atelierLocation,
        storeName,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch store statistics." },
      { status: 500 }
    );
  }
}
