import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status");
    const orderNumber = searchParams.get("orderNumber");
    const paymentStatus = searchParams.get("paymentStatus");
    const orderDate = searchParams.get("orderDate");

    const db = getDb();
    let orderList: any[] = [];

    if (db) {
      try {
        const query = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
        const rows = await query;

        for (const ord of rows) {
          const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, ord.id));
          orderList.push({
            ...ord,
            items,
            createdAt: ord.createdAt ? ord.createdAt.toISOString() : new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("DB admin orders error (using fallback store):", err);
      }
    }

    if (orderList.length === 0) {
      const mem = Array.from(inMemoryStore.orders.values());
      const seen = new Set();
      for (const o of mem) {
        if (!seen.has(o.orderNumber)) {
          seen.add(o.orderNumber);
          orderList.push(o);
        }
      }
    }

    // Filter by single order if requested
    if (orderNumber) {
      const single = orderList.find((o) => o.orderNumber === orderNumber || o.id === orderNumber);
      if (!single) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { order: single } });
    }

    // Filter by status
    if (status && status !== "all") {
      orderList = orderList.filter((o) => o.status === status);
    }

    if (paymentStatus && paymentStatus !== "all") orderList = orderList.filter((o) => o.paymentStatus === paymentStatus);
    if (orderDate) orderList = orderList.filter((o) => o.createdAt?.toString().slice(0, 10) === orderDate);

    // Filter by search
    if (search) {
      orderList = orderList.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(search) ||
          o.customerName?.toLowerCase().includes(search) ||
          o.customerEmail?.toLowerCase().includes(search) ||
          o.customerPhone?.toLowerCase().includes(search) ||
          o.trackingNumber?.toLowerCase().includes(search) ||
          o.paystackReference?.toLowerCase().includes(search) ||
          o.paystackTransactionId?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: { orders: orderList },
    });
  } catch (error: any) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const {
      orderNumber,
      status,
      paymentStatus,
      trackingCarrier,
      trackingNumber,
      trackingUrl,
      trackingStatus,
      estimatedDelivery,
      notes,
    } = await req.json();

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Order Number is required." }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
      if (paymentStatus === "paid") {
        updates.paidAt = new Date();
      }
    }
    if (trackingCarrier !== undefined) updates.trackingCarrier = trackingCarrier;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) updates.trackingUrl = trackingUrl;
    if (trackingStatus !== undefined) updates.trackingStatus = trackingStatus;
    if (estimatedDelivery !== undefined) updates.estimatedDelivery = estimatedDelivery;
    if (notes !== undefined) updates.notes = notes;

    const db = getDb();
    if (db) {
      try {
        await db
          .update(schema.orders)
          .set(updates)
          .where(eq(schema.orders.orderNumber, orderNumber));

        // Also check if shipping record exists or insert/update it
        const existingOrder = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.orderNumber, orderNumber))
          .limit(1);

        if (existingOrder.length > 0 && (trackingNumber || trackingCarrier)) {
          const ordId = existingOrder[0].id;
          await db
            .insert(schema.shipping)
            .values({
              orderId: ordId,
              carrier: trackingCarrier || existingOrder[0].trackingCarrier || "GIG Logistics",
              trackingNumber: trackingNumber || existingOrder[0].trackingNumber,
              trackingUrl: trackingUrl || existingOrder[0].trackingUrl,
              status: status === "delivered" ? "delivered" : status === "shipped" ? "in_transit" : "preparing",
              shippingFee: existingOrder[0].shippingFee,
              estimatedDelivery: estimatedDelivery || existingOrder[0].estimatedDelivery,
            })
            .onConflictDoNothing();
        }
      } catch (err) {
        console.warn("DB update order error (using fallback store):", err);
      }
    }

    const mem = inMemoryStore.orders.get(orderNumber);
    if (mem) {
      Object.assign(mem, updates);
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderNumber} updated successfully.`,
      data: { order: mem || updates },
    });
  } catch (error: any) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order." },
      { status: 500 }
    );
  }
}
