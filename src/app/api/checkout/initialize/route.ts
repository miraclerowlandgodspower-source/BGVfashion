import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, inMemoryStore, getProductById } from "@/lib/db";
import * as schema from "@/db/schema";
import { initializePaystackTransaction } from "@/lib/paystack";
import { calculateShippingFee } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const { items, shippingAddress, currency = "NGN" } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your bag is empty." },
        { status: 400 }
      );
    }

    if (!shippingAddress?.fullName || !shippingAddress?.email || !shippingAddress?.addressLine || !shippingAddress?.city) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required shipping address fields." },
        { status: 400 }
      );
    }

    // Verify all products and calculate authoritative subtotal on server
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await getProductById(item.productId || item.id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId || item.id} is no longer available.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.min(10, Number(item.quantity) || 1));
      const lineTotal = product.price * qty;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size || "M",
        quantity: qty,
        unitPrice: product.price,
        totalPrice: lineTotal,
      });
    }

    // Calculate verified distance-based shipping from Ojo, Lagos
    const shippingCalc = calculateShippingFee({
      country: shippingAddress.country || "Nigeria",
      state: shippingAddress.state || "",
      city: shippingAddress.city || "",
      subtotal,
    });

    const shippingFee = shippingCalc.fee;
    const taxFee = 0;
    const totalAmount = subtotal + shippingFee + taxFee;

    const user = await getSessionUser();
    const orderId = crypto.randomUUID();
    const orderNumber = `BGV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const reference = `ref_${orderNumber}_${Date.now()}`;
    const defaultCarrier = shippingCalc.couriers[0] || "GIG Logistics";
    const trackingNumber = `${defaultCarrier.split(" ")[0].toUpperCase()}-${orderNumber}`;

    // Initialize transaction with Paystack (supporting Visa, Mastercard, Verve, Apple Pay, Google Pay)
    const paystackRes = await initializePaystackTransaction({
      email: shippingAddress.email,
      amount: totalAmount,
      reference,
      currency,
      metadata: {
        orderId,
        orderNumber,
        customerName: shippingAddress.fullName,
        destinationZone: shippingCalc.zone,
        carrier: defaultCarrier,
        itemsCount: verifiedItems.length,
      },
    });

    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.orders).values({
          id: orderId as any,
          orderNumber,
          userId: (user?.id as any) || null,
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.fullName,
          status: "pending",
          subtotal,
          shippingFee,
          taxFee,
          totalAmount,
          currency,
          shippingAddress,
          paystackReference: reference,
          paystackAccessCode: paystackRes.data.access_code,
          trackingCarrier: defaultCarrier,
          trackingNumber,
          trackingStatus: "Payment Pending",
          estimatedDelivery: shippingCalc.estimatedDays,
        });

        for (const item of verifiedItems) {
          await db.insert(schema.orderItems).values({
            orderId: orderId as any,
            productId: item.productId,
            productName: item.productName,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          });
        }
      } catch (dbErr) {
        console.warn("DB order creation error:", dbErr);
      }
    }

    // In-memory store
    const orderRecord = {
      id: orderId,
      orderNumber,
      userId: user?.id || null,
      customerEmail: shippingAddress.email,
      customerName: shippingAddress.fullName,
      status: "pending",
      subtotal,
      shippingFee,
      taxFee,
      totalAmount,
      currency,
      shippingAddress,
      paystackReference: reference,
      trackingCarrier: defaultCarrier,
      trackingNumber,
      trackingStatus: "Payment Pending",
      estimatedDelivery: shippingCalc.estimatedDays,
      createdAt: new Date().toISOString(),
      items: verifiedItems,
    };

    inMemoryStore.orders.set(orderNumber, orderRecord);
    inMemoryStore.orders.set(reference, orderRecord);

    return NextResponse.json({
      success: true,
      data: {
        orderNumber,
        reference,
        authorizationUrl: paystackRes.data.authorization_url,
        accessCode: paystackRes.data.access_code,
        totalAmount,
        currency,
        shippingFee,
      },
    });
  } catch (error: any) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
