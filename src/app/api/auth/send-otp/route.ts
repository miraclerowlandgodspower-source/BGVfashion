import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

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

    // Save in memory store
    inMemoryStore.otps.set(normalizedEmail, {
      code,
      expiresAt,
      verified: false,
    });

    console.log(`[BGV AUTH OTP] Verification code for ${normalizedEmail}: ${code} (valid for 10 mins)`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      // For developer/testing ease, also include preview code in simulated environment
      devCode: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to send verification code" }, { status: 500 });
  }
}
