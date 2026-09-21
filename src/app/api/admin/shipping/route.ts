import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const db = getDb();
    let shipments: any[] = [];

    if (db) {
      try {
        // Fetch orders that need fulfillment or have tracking
        const orderRows = await db
          .select()
          .from(schema.orders)
          .orderBy(desc(schema.orders.createdAt));

        for (const ord of orderRows) {
          shipments.push({
            orderId: ord.id,
            orderNumber: ord.orderNumber,
            customerName: ord.customerName,
            customerEmail: ord.customerEmail,
            customerPhone: ord.customerPhone,
            shippingAddress: ord.shippingAddress,
            carrier: ord.trackingCarrier || "GIG Logistics",
            trackingNumber: ord.trackingNumber || "",
            trackingUrl: ord.trackingUrl || "",
            status: ord.status,
            trackingStatus: ord.trackingStatus || "Preparing in Atelier",
            shippingFee: ord.shippingFee,
            estimatedDelivery: ord.estimatedDelivery || "2-4 Business Days",
            createdAt: ord.createdAt ? ord.createdAt.toISOString() : new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("DB shipping query error (using fallback):", err);
      }
    }

    if (shipments.length === 0) {
      shipments = Array.from(inMemoryStore.orders.values()).map((ord) => ({
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        customerName: ord.customerName,
        customerEmail: ord.customerEmail,
        customerPhone: ord.customerPhone,
        shippingAddress: ord.shippingAddress,
        carrier: ord.trackingCarrier || "GIG Logistics",
        trackingNumber: ord.trackingNumber || "",
        trackingUrl: ord.trackingUrl || "",
        status: ord.status,
        trackingStatus: ord.trackingStatus || "Preparing in Atelier",
        shippingFee: ord.shippingFee,
        estimatedDelivery: ord.estimatedDelivery || "2-4 Business Days",
        createdAt: ord.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      data: { shipments },
    });
  } catch (error: any) {
    console.error("Failed to fetch shipments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipments." },
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
      carrier,
      trackingNumber,
      trackingUrl,
      trackingStatus,
      estimatedDelivery,
      status,
    } = await req.json();

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order Number is required." },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (carrier !== undefined) updates.trackingCarrier = carrier;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) updates.trackingUrl = trackingUrl;
    if (trackingStatus !== undefined) updates.trackingStatus = trackingStatus;
    if (estimatedDelivery !== undefined) updates.estimatedDelivery = estimatedDelivery;
    if (status !== undefined) updates.status = status;

    const db = getDb();
    if (db) {
      try {
        await db
          .update(schema.orders)
          .set(updates)
          .where(eq(schema.orders.orderNumber, orderNumber));

        // Sync shipping table
        const ordRes = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.orderNumber, orderNumber))
          .limit(1);

        if (ordRes.length > 0) {
          const ord = ordRes[0];
          await db
            .insert(schema.shipping)
            .values({
              orderId: ord.id,
              carrier: carrier || ord.trackingCarrier || "GIG Logistics",
              trackingNumber: trackingNumber || ord.trackingNumber,
              trackingUrl: trackingUrl || ord.trackingUrl,
              status: status === "delivered" ? "delivered" : status === "shipped" ? "in_transit" : "preparing",
              shippingFee: ord.shippingFee,
              estimatedDelivery: estimatedDelivery || ord.estimatedDelivery,
            })
            .onConflictDoNothing();
        }
      } catch (err) {
        console.warn("DB update shipping error:", err);
      }
    }

    const mem = inMemoryStore.orders.get(orderNumber);
    if (mem) {
      Object.assign(mem, updates);
    }

    return NextResponse.json({
      success: true,
      message: `Shipment for order ${orderNumber} updated successfully.`,
      data: { shipment: mem || updates },
    });
  } catch (error: any) {
    console.error("Failed to update shipping:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update shipment." },
      { status: 500 }
    );
  }
}
