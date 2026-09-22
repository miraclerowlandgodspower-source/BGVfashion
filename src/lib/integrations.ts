import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { getDb } from "@/lib/db";

export type IntegrationStatus = "connected" | "not_configured" | "error";

export interface IntegrationResult {
  id: string;
  name: string;
  status: IntegrationStatus;
  lastSuccessfulCheck: string | null;
  requiredEnv: string[];
  message: string;
}

const REQUEST_TIMEOUT_MS = 10000;

function hasValue(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function isConfigured(names: string[]): boolean {
  return names.every(hasValue);
}

function safeFailureMessage(): string {
  return "Connection failed. Check the server configuration and provider settings.";
}

function result(
  id: string,
  name: string,
  requiredEnv: string[],
  status: IntegrationStatus,
  message: string,
  lastSuccessfulCheck: string | null = null
): IntegrationResult {
  return { id, name, requiredEnv, status, message, lastSuccessfulCheck };
}

function notConfigured(id: string, name: string, requiredEnv: string[]): IntegrationResult {
  return result(id, name, requiredEnv, "not_configured", "Not configured");
}

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
}

function successful(id: string, name: string, requiredEnv: string[], message: string): IntegrationResult {
  return result(id, name, requiredEnv, "connected", message, new Date().toISOString());
}

async function checkDatabase(): Promise<IntegrationResult> {
  const env = ["DATABASE_URL"];
  if (!isConfigured(env)) return notConfigured("database", "Neon PostgreSQL", env);

  try {
    const db = getDb();
    if (!db) return result("database", "Neon PostgreSQL", env, "error", safeFailureMessage());
    await db.execute(sql`select 1`);
    return successful("database", "Neon PostgreSQL", env, "Database query completed successfully.");
  } catch (error) {
    console.error("Integration check failed: database", error);
    return result("database", "Neon PostgreSQL", env, "error", safeFailureMessage());
  }
}

async function checkPaystack(): Promise<IntegrationResult> {
  const env = ["PAYSTACK_SECRET_KEY"];
  if (!isConfigured(env)) return notConfigured("paystack", "Paystack", env);

  try {
    const response = await fetchWithTimeout("https://api.paystack.co/bank?country=nigeria&perPage=1", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.status) throw new Error("Paystack rejected the request");
    const mode = process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test") ? "test" : "live";
    return successful("paystack", "Paystack", env, `Paystack ${mode} mode is responding.`);
  } catch (error) {
    console.error("Integration check failed: paystack", error);
    return result("paystack", "Paystack", env, "error", safeFailureMessage());
  }
}

async function checkResend(): Promise<IntegrationResult> {
  const env = ["EMAIL_API_KEY", "EMAIL_FROM", "ADMIN_NOTIFICATION_EMAIL"];
  if (!isConfigured(env)) return notConfigured("resend", "Resend email", env);

  try {
    const response = await fetchWithTimeout("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}` },
    });
    if (!response.ok) throw new Error("Resend rejected the request");
    return successful("resend", "Resend email", env, "Resend API is responding.");
  } catch (error) {
    console.error("Integration check failed: resend", error);
    return result("resend", "Resend email", env, "error", safeFailureMessage());
  }
}

async function checkMapbox(): Promise<IntegrationResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const requiredEnv = ["MAPBOX_ACCESS_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN"];
  if (!token) return notConfigured("mapbox", "Mapbox", requiredEnv);

  try {
    const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/Lagos.json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("access_token", token);
    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) throw new Error("Mapbox rejected the request");
    return successful("mapbox", "Mapbox", requiredEnv, "Mapbox geocoding API is responding.");
  } catch (error) {
    console.error("Integration check failed: mapbox", error);
    return result("mapbox", "Mapbox", requiredEnv, "error", safeFailureMessage());
  }
}

function cloudinarySignature(parameters: Record<string, string>): string {
  const payload = `${Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&")}${process.env.CLOUDINARY_API_SECRET}`;
  return crypto.createHash("sha1").update(payload).digest("hex");
}

async function checkCloudinary(): Promise<IntegrationResult> {
  const env = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  if (!isConfigured(env)) return notConfigured("cloudinary", "Cloudinary", env);

  try {
    const credentials = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString("base64");
    const response = await fetchWithTimeout(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME!)}/resources/image?max_results=1`,
      { headers: { Authorization: `Basic ${credentials}` } }
    );
    if (!response.ok) throw new Error("Cloudinary rejected the request");
    return successful("cloudinary", "Cloudinary", env, "Cloudinary API is responding.");
  } catch (error) {
    console.error("Integration check failed: cloudinary", error);
    return result("cloudinary", "Cloudinary", env, "error", safeFailureMessage());
  }
}

async function checkAuth(): Promise<IntegrationResult> {
  const env = ["AUTH_SECRET or JWT_SECRET"];
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) return notConfigured("auth", "Auth/JWT", env);

  try {
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ integrationCheck: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(key);
    await jwtVerify(token, key);
    return successful("auth", "Auth/JWT", env, "JWT signing and verification completed successfully.");
  } catch (error) {
    console.error("Integration check failed: auth", error);
    return result("auth", "Auth/JWT", env, "error", safeFailureMessage());
  }
}

async function checkShipping(): Promise<IntegrationResult> {
  const env = ["SHIPPING_API_URL", "SHIPPING_API_KEY"];
  if (!isConfigured(env)) return notConfigured("shipping", "Shipping/tracking API", env);

  try {
    const response = await fetchWithTimeout(process.env.SHIPPING_API_URL!, {
      headers: { Authorization: `Bearer ${process.env.SHIPPING_API_KEY}` },
    });
    if (!response.ok) throw new Error("Shipping provider rejected the request");
    return successful("shipping", "Shipping/tracking API", env, "Shipping provider is responding.");
  } catch (error) {
    console.error("Integration check failed: shipping", error);
    return result("shipping", "Shipping/tracking API", env, "error", safeFailureMessage());
  }
}

export async function checkIntegration(id: string): Promise<IntegrationResult> {
  switch (id) {
    case "database": return checkDatabase();
    case "paystack": return checkPaystack();
    case "resend": return checkResend();
    case "mapbox": return checkMapbox();
    case "cloudinary": return checkCloudinary();
    case "auth": return checkAuth();
    case "shipping": return checkShipping();
    default: throw new Error("Unknown integration");
  }
}

export async function sendTestEmail(): Promise<IntegrationResult> {
  const env = ["EMAIL_API_KEY", "EMAIL_FROM", "ADMIN_NOTIFICATION_EMAIL"];
  if (!isConfigured(env)) return notConfigured("resend", "Resend email", env);

  try {
    const response = await fetchWithTimeout("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.ADMIN_NOTIFICATION_EMAIL],
        subject: "BGV Fashion integration test",
        text: "This is a test email from the BGV Fashion admin integrations panel.",
      }),
    });
    if (!response.ok) throw new Error("Resend rejected the test email");
    return successful("resend", "Resend email", env, "Test email sent successfully.");
  } catch (error) {
    console.error("Integration action failed: resend test email", error);
    return result("resend", "Resend email", env, "error", safeFailureMessage());
  }
}

export async function testCloudinaryUpload(): Promise<IntegrationResult> {
  const env = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  if (!isConfigured(env)) return notConfigured("cloudinary", "Cloudinary", env);

  let publicId = "";
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uploadParameters = { timestamp };
    const body = new URLSearchParams({
      file: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
      api_key: process.env.CLOUDINARY_API_KEY!,
      timestamp,
      signature: cloudinarySignature(uploadParameters),
    });
    const response = await fetchWithTimeout(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME!)}/image/upload`,
      { method: "POST", body }
    );
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.public_id) throw new Error("Cloudinary rejected the test upload");
    publicId = data.public_id;
    return successful("cloudinary", "Cloudinary", env, "Test upload completed successfully.");
  } catch (error) {
    console.error("Integration action failed: cloudinary test upload", error);
    return result("cloudinary", "Cloudinary", env, "error", safeFailureMessage());
  } finally {
    if (publicId) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const destroyBody = new URLSearchParams({
          public_id: publicId,
          api_key: process.env.CLOUDINARY_API_KEY!,
          timestamp,
          signature: cloudinarySignature({ public_id: publicId, timestamp }),
        });
        await fetchWithTimeout(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME!)}/image/destroy`,
          { method: "POST", body: destroyBody }
        );
      } catch (error) {
        console.warn("Cloudinary test asset cleanup failed:", error);
      }
    }
  }
}

export async function getIntegrationStatuses(): Promise<IntegrationResult[]> {
  return Promise.all(["database", "paystack", "resend", "mapbox", "cloudinary", "auth", "shipping"].map(checkIntegration));
}