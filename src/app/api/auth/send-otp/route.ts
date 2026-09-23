import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import { sendOtpEmail } from "@/lib/bgv-email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }
    const now = Date.now();
    const resendWindowMs = 60 * 1000;
    const previous = inMemoryStore.otps.get(normalizedEmail);

    if (previous && previous.expiresAt > now && now - (previous.expiresAt - 10 * 60 * 1000) < resendWindowMs) {
      return NextResponse.json({
        success: false,
        error: "A verification code was already sent recently. Please wait before requesting another one.",
      }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000;

    if (process.env.EMAIL_API_KEY) {
      const delivered = await sendOtpEmail(normalizedEmail, code);
      if (!delivered) {
        const emailFrom = process.env.EMAIL_FROM || "admin@bgvfashion.shop";
        return NextResponse.json({
          success: false,
          error: `We could not deliver your verification email from ${emailFrom}. Check Resend domain verification and try again.`,
        }, { status: 502 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Email verification is not configured. Please contact support." }, { status: 503 });
    }

    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.emailOtps).values({
          email: normalizedEmail,
          code,
          expiresAt: new Date(expiresAt),
          verified: false,
        });
      } catch (err) {
        console.warn("DB OTP insert notice:", err);
      }
    }

    inMemoryStore.otps.set(normalizedEmail, {
      code,
      expiresAt,
      verified: false,
    });

    console.log(`[BGV AUTH OTP] Verification code for ${normalizedEmail}: ${code} (valid for 10 mins)`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      devCode: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to send verification code" }, { status: 500 });
  }
}
