import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/email";

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

    const emailApiKey = process.env.EMAIL_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || "admin@bgvfashion.shop";
    if (emailApiKey && emailFrom) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${emailApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "admin@bgvfashion.shop",
          to: [normalizedEmail],
          subject: "Your BGV Fashion verification code",
          text: `Your BGV Fashion verification code is ${code}. It expires in 10 minutes.`,
          html: `<p>Your BGV Fashion verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p>`,
        }),
      });
      if (!emailResponse.ok) {
        const providerError = await emailResponse.json().catch(() => null) as { name?: string; message?: string } | null;
        const senderNotVerified = providerError?.name === "validation_error" || /domain|sender|from/i.test(providerError?.message || "");
        console.error("OTP email delivery failed:", {
          status: emailResponse.status,
          providerError: providerError?.name || "unknown",
        });
        return NextResponse.json({
          success: false,
          error: senderNotVerified
            ? `Email delivery is not configured for ${emailFrom}. Verify the sender domain in Resend, then try again.`
            : "We could not deliver your verification email. Please try again shortly.",
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
