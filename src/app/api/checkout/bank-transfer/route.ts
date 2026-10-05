import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, getProductById, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { calculateShippingFee } from "@/lib/shipping";
import { calculateOrderTotal } from "@/lib/order-totals";
import { Order } from "@/types";

type TransferRail = "BACS_GBP" | "SWIFT_USD";

function transferConfig(rail: TransferRail) {
  if (rail === "BACS_GBP") {
    const ngnPerUnit = Number(process.env.BGV_NGN_PER_GBP || "0");
    const details = {
      accountName: process.env.BGV_BACS_ACCOUNT_NAME || "",
      bankName: process.env.BGV_BACS_BANK_NAME || "",
      accountNumber: process.env.BGV_BACS_ACCOUNT_NUMBER || "",
      sortCode: process.env.BGV_BACS_SORT_CODE || "",
    };
    return {
      rail,
      currency: "GBP",
      label: "UK bank transfer (Bacs)",
      ngnPerUnit,
      details,
      configured: ngnPerUnit > 0 && Boolean(details.accountName && details.accountNumber && details.sortCode),
    };
  }

  const ngnPerUnit = Number(process.env.BGV_NGN_PER_USD || "0");
  const details = {
    accountName: process.env.BGV_USD_ACCOUNT_NAME || "",
    bankName: process.env.BGV_USD_BANK_NAME || "",
    accountNumber: process.env.BGV_USD_ACCOUNT_NUMBER || "",
    swiftBic: process.env.BGV_USD_SWIFT_BIC || "",
    routingNumber: process.env.BGV_USD_ROUTING_NUMBER || "",
    bankAddress: process.env.BGV_USD_BANK_ADDRESS || "",
  };
  return {
    rail,
    currency: "USD",
    label: "International USD bank transfer (SWIFT)",
    ngnPerUnit,
    details,
    configured: ngnPerUnit > 0 && Boolean(details.accountName && details.bankName && details.accountNumber && details.swiftBic),
  };
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Please sign in before checking out." }, { status: 401 });
    }

    const { items, shippingAddress, rail } = await req.json();
    if (rail !== "BACS_GBP" && rail !== "SWIFT_USD") {
      return NextResponse.json({ success: false, error: "Choose a valid international bank-transfer option." }, { status: 400 });
    }

    const config = transferConfig(rail);
    if (!config.configured) {
      return NextResponse.json(
        {
          success: false,
          error:
            rail === "BACS_GBP"
              ? "Bacs payments are not fully configured yet. Add the BGV Bacs account details and NGN/GBP rate in Vercel."
              : "USD bank transfers are not fully configured yet. Add the BGV USD account details, SWIFT/BIC and NGN/USD rate in Vercel.",
        },
        { status: 503 }
      );
    }

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
    const transferAmount = Math.ceil((totalAmount / config.ngnPerUnit) * 100) / 100;

    const orderId = crypto.randomUUID();
    const orderNumber = `BGV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const reference = `BANK-${orderNumber}`;
    const defaultCarrier = shippingCalc.couriers[0] || "GIG Logistics";
    const trackingNumber = `${defaultCarrier.split(" ")[0].toUpperCase()}-${orderNumber}`;
    const notes = `${config.label}; customer must use reference ${reference}. Transfer amount: ${config.currency} ${transferAmount.toFixed(2)}. Awaiting manual bank verification.`;

    const db = getDb();
    if (db) {
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
        paymentMethod: config.label,
        paymentStatus: "pending",
        trackingCarrier: defaultCarrier,
        trackingNumber,
        trackingStatus: "Awaiting Bank Transfer",
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
      paymentMethod: config.label,
      paymentStatus: "pending",
      trackingCarrier: defaultCarrier,
      trackingNumber,
      trackingStatus: "Awaiting Bank Transfer",
      estimatedDelivery: shippingCalc.estimatedDays,
      notes,
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
        rail: config.rail,
        currency: config.currency,
        amount: transferAmount,
        bankDetails: config.details,
        message: "Use the exact payment reference. Your order remains pending until BGV verifies cleared funds.",
      },
    });
  } catch (error: any) {
    console.error("International bank transfer initialization failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Could not create the bank-transfer order." },
      { status: 500 }
    );
  }
}
