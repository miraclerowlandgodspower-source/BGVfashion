import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ success: false, error: "Please enter your Order Number or Tracking Reference" }, { status: 400 });
    }

    const db = getDb();
    let order: any = null;
    let items: any[] = [];

    if (db) {
      try {
        const found = await db
          .select()
          .from(schema.orders)
          .where(or(eq(schema.orders.orderNumber, query), eq(schema.orders.paystackReference, query), eq(schema.orders.trackingNumber, query), eq(schema.orders.customerEmail, query.toLowerCase())))
          .limit(1);

        if (found.length > 0) {
          order = found[0];
          items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
          order.trackingEvents = await db.select().from(schema.shippingEvents).where(eq(schema.shippingEvents.orderId, order.id)).orderBy(schema.shippingEvents.createdAt);
        }
      } catch (err) {
        console.warn("DB track error:", err);
      }
    }

    if (!order) {
      order = inMemoryStore.orders.get(query);
      if (order?.items) items = order.items;
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        error: `No order found matching "${query}". Please check the reference in your confirmation email.`,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...order,
          trackingCarrier: order.trackingCarrier || "GIG Logistics",
          trackingNumber: order.trackingNumber || `TRK-${order.orderNumber}`,
          trackingStatus: order.trackingStatus || (order.status === "paid" ? "Preparing in Ojo Atelier" : order.status),
          trackingEvents: order.trackingEvents || [],
          estimatedDelivery: order.estimatedDelivery || "2–4 business days",
        },
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to track order" }, { status: 500 });
  }
}
