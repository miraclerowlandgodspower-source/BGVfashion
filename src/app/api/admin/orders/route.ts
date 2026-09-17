import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    let orderList: any[] = [];

    if (db) {
      try {
        const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
        for (const ord of rows) {
          const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, ord.id));
          orderList.push({ ...ord, items });
        }
      } catch (err) {
        console.warn("DB admin orders error:", err);
      }
    }

    if (orderList.length === 0) {
      const mem = Array.from(inMemoryStore.orders.values());
      // Unique by orderNumber
      const seen = new Set();
      for (const o of mem) {
        if (!seen.has(o.orderNumber)) {
          seen.add(o.orderNumber);
          orderList.push(o);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { orders: orderList },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { orderNumber, status, trackingCarrier, trackingNumber, trackingStatus, estimatedDelivery } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Order Number required" }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      try {
        await db
          .update(schema.orders)
          .set({
            ...(status && { status }),
            ...(trackingCarrier && { trackingCarrier }),
            ...(trackingNumber && { trackingNumber }),
            ...(trackingStatus && { trackingStatus }),
            ...(estimatedDelivery && { estimatedDelivery }),
          })
          .where(eq(schema.orders.orderNumber, orderNumber));
      } catch (err) {
        console.warn("DB update order error:", err);
      }
    }

    const mem = inMemoryStore.orders.get(orderNumber);
    if (mem) {
      if (status) mem.status = status;
      if (trackingCarrier) mem.trackingCarrier = trackingCarrier;
      if (trackingNumber) mem.trackingNumber = trackingNumber;
      if (trackingStatus) mem.trackingStatus = trackingStatus;
      if (estimatedDelivery) mem.estimatedDelivery = estimatedDelivery;
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderNumber} updated successfully!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
