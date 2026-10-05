import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, getProductById, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { calculateShippingFee } from "@/lib/shipping";
import { calculateOrderTotal } from "@/lib/order-totals";
import { Order } from "@/types";

function getBachsBaseUrl(apiKey: string) {
  return apiKey.startsWith("sk_sandbox_") ? "https://sandbox-api.bachs.io" : "https://api.bachs.io";
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Please sign in before checking out." }, { status: 401 });
    }

    const apiKey = process.env.BACHS_API_KEY || "";
    if (!apiKey || (!apiKey.startsWith("sk_sandbox_") && !apiKey.startsWith("sk_live_"))) {
      return NextResponse.json(
        { success: false, error: "Bachs checkout is not configured yet." },
        { status: 503 }
      );
    }

    const ngnPerUsd = Number(process.env.BGV_NGN_PER_USD || "0");
    if (!Number.isFinite(ngnPerUsd) || ngnPerUsd <= 0) {
      return NextResponse.json(
        { success: false, error: "Bachs USD pricing is not configured yet." },
        { status: 503 }
      );
    }

    const { items, shippingAddress } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Your bag is empty." }, { status: 400 });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.email || !shippingAddress?.phone || !shippingAddress?.addressLine || !shippingAddress?.city) {
      return NextResponse.json({ success: false, error: "Please fill in all required shipping address fields." }, { status: 400 });
    }

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
      const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1));
      const lineTotal = product.price * quantity;
      subtotal += lineTotal;
      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        colour: item.colour || product.colors?.[0] || null,
        size: item.size || "M",
        quantity,
        unitPrice: product.price,
        totalPrice: lineTotal,
      });
    }

    const shippingCalc = calculateShippingFee({
      country: shippingAddress.country || "Nigeria",
      state: shippingAddress.state || "",
      city: shippingAddress.city || "",
      subtotal,
    });
    const totals = calculateOrderTotal(subtotal, shippingCalc.fee);
    const totalAmount = totals.total;
    const usdAmount = Math.ceil((totalAmount / ngnPerUsd) * 100) / 100;

    const orderId = crypto.randomUUID();
    const orderNumber = `BGV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const defaultCarrier = shippingCalc.couriers[0] || "GIG Logistics";
    const trackingNumber = `${defaultCarrier.split(" ")[0].toUpperCase()}-${orderNumber}`;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://bgvfashion.shop").replace(/\/$/, "");

    const bachsResponse = await fetch(`${getBachsBaseUrl(apiKey)}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pricing: {
          currency: "USD",
          amount: usdAmount.toFixed(2),
          currency_options: {
            NGN: totalAmount.toFixed(2),
          },
        },
        customer: {
          email: shippingAddress.email,
          name: shippingAddress.fullName,
          phone_number: shippingAddress.phone,
        },
        success_url: `${siteUrl}/account?payment=processing&provider=bachs`,
        cancel_url: `${siteUrl}/checkout?payment=cancelled&provider=bachs`,
        reference: orderNumber,
        metadata: {
          orderNumber,
          orderId,
          expectedNgn: String(totalAmount),
          expectedUsd: usdAmount.toFixed(2),
          source: "bgv-fashion",
        },
        customer_creation: "if_required",
        expires_in_minutes: 60,
      }),
      cache: "no-store",
    });

    const bachsJson = await bachsResponse.json().catch(() => null);
    if (!bachsResponse.ok || !bachsJson?.checkout_url || !bachsJson?.checkout_id) {
      console.error("Bachs checkout creation failed:", bachsJson);
      return NextResponse.json(
        { success: false, error: bachsJson?.message || bachsJson?.detail || "Bachs could not create a checkout session." },
        { status: 502 }
      );
    }

    const notes = `Bachs checkout ${bachsJson.checkout_id}; USD ${usdAmount.toFixed(2)}; NGN order value ${totalAmount}; awaiting signed collection.succeeded webhook.`;
    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.orders).values({
          id: orderId as any,
          orderNumber,
          userId: user.id as any,
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.fullName,
          customerPhone: shippingAddress.phone,
          status: "pending",
          subtotal,
          shippingFee: totals.deliveryFee,
          taxFee: totals.vatFee,
          totalAmount,
          currency: "NGN",
          shippingAddress,
          paymentMethod: "Bachs",
          paymentStatus: "pending",
          trackingCarrier: defaultCarrier,
          trackingNumber,
          trackingStatus: "Payment Pending",
          estimatedDelivery: shippingCalc.estimatedDays,
          notes,
        });

        for (const item of verifiedItems) {
          await db.insert(schema.orderItems).values({
            orderId: orderId as any,
            productId: item.productId,
            productName: item.productName,
            colour: item.colour,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          });
        }
      } catch (dbErr) {
        console.warn("Bachs DB order creation error:", dbErr);
      }
    }

    const orderRecord: Order = {
      id: orderId,
      orderNumber,
      userId: user.id,
      customerEmail: shippingAddress.email,
      customerName: shippingAddress.fullName,
      customerPhone: shippingAddress.phone,
      status: "pending",
      subtotal,
      shippingFee: totals.deliveryFee,
      taxFee: totals.vatFee,
      totalAmount,
      currency: "NGN",
      shippingAddress,
      paymentMethod: "Bachs",
      paymentStatus: "pending",
      trackingCarrier: defaultCarrier,
      trackingNumber,
      trackingStatus: "Payment Pending",
      estimatedDelivery: shippingCalc.estimatedDays,
      notes,
      createdAt: new Date().toISOString(),
      items: verifiedItems,
    };
    inMemoryStore.orders.set(orderNumber, orderRecord);

    return NextResponse.json({
      success: true,
      data: {
        orderNumber,
        checkoutId: bachsJson.checkout_id,
        checkoutUrl: bachsJson.checkout_url,
        amount: usdAmount,
        currency: "USD",
      },
    });
  } catch (error: any) {
    console.error("Bachs checkout initialization failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Could not initialize Bachs checkout." },
      { status: 500 }
    );
  }
}
