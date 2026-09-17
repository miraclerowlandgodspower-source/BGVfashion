import crypto from "crypto";

export interface InitializePaystackOptions {
  email: string;
  amount: number; // in minor units / kobo (e.g. 42000 NGN = 4200000 kobo)
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  currency?: string;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string; // "success", "failed", "abandoned"
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata?: any;
  };
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function initializePaystackTransaction(
  options: InitializePaystackOptions
): Promise<PaystackInitResponse> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // If secret key is not set or is demo key, return a mock checkout URL for seamless dev
  if (!secret || secret.startsWith("sk_test_demo") || secret === "sk_test_your_paystack_secret_key_here") {
    console.warn("Paystack Secret Key is using test/development placeholder. Providing simulated checkout redirect.");
    return {
      status: true,
      message: "Authorization URL created (development mode)",
      data: {
        authorization_url: `${baseUrl}/checkout/success?reference=${options.reference}&mode=simulated`,
        access_code: `mock_acc_${options.reference}`,
        reference: options.reference,
      },
    };
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: options.email,
      amount: options.amount * 100, // convert NGN to kobo
      reference: options.reference,
      callback_url: options.callbackUrl || `${baseUrl}/checkout/success`,
      currency: options.currency || "NGN",
      metadata: options.metadata,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }

  return data;
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  // If in simulated dev mode
  if (!secret || secret.startsWith("sk_test_demo") || secret === "sk_test_your_paystack_secret_key_here") {
    return {
      status: true,
      message: "Verification successful (development mode)",
      data: {
        id: Math.floor(Math.random() * 100000),
        status: "success",
        reference,
        amount: 0,
        currency: "NGN",
        paid_at: new Date().toISOString(),
        customer: {
          id: 1,
          email: "customer@example.com",
          customer_code: "CUS_dev123",
        },
      },
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to verify transaction with Paystack");
  }

  return data;
}

export function verifyPaystackWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}
