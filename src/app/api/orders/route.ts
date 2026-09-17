import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    let userOrders: any[] = [];

    if (db) {
      try {
        const orderRows = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.userId, user.id as any))
          .orderBy(desc(schema.orders.createdAt));

        for (const ord of orderRows) {
          const items = await db
            .select()
            .from(schema.orderItems)
            .where(eq(schema.orderItems.orderId, ord.id));
          userOrders.push({
            ...ord,
            items,
          });
        }
      } catch (err) {
        console.warn("DB orders fetch notice:", err);
      }
    }

    if (userOrders.length === 0) {
      // Check inMemoryStore
      for (const ord of inMemoryStore.orders.values()) {
        if (ord.userId === user.id || ord.customerEmail === user.email) {
          if (!userOrders.some((o) => o.orderNumber === ord.orderNumber)) {
            userOrders.push(ord);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { orders: userOrders },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
