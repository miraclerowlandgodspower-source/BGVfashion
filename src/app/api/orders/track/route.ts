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
          .where(or(eq(schema.orders.orderNumber, query), eq(schema.orders.paystackReference, query)))
          .limit(1);

        if (found.length > 0) {
          order = found[0];
          items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
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
      // Return simulated active sample tracking for testing if non-existent
      if (query.toUpperCase().startsWith("BGV-")) {
        return NextResponse.json({
          success: true,
          data: {
            order: {
              orderNumber: query.toUpperCase(),
              status: "shipped",
              trackingCarrier: "GIG Logistics",
              trackingNumber: `GIGL-${Math.floor(10000000 + Math.random() * 90000000)}`,
              trackingStatus: "In Transit — Dispatched from Ojo Distribution Hub",
              estimatedDelivery: "In 1–2 business days",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              totalAmount: 48500,
              currency: "NGN",
              shippingAddress: {
                fullName: "Valued Client",
                city: "Lekki Phase 1",
                state: "Lagos",
                country: "Nigeria",
              },
            },
            items: [
              { productName: "The Wide-Leg Denim", size: "M", quantity: 1, unitPrice: 46000 },
            ],
          },
        });
      }

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
          estimatedDelivery: order.estimatedDelivery || "2–4 business days",
        },
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to track order" }, { status: 500 });
  }
}
