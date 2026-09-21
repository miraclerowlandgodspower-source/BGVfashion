import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, code, name } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and verification code are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let isValid = false;

    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.emailOtps)
          .where(and(eq(schema.emailOtps.email, normalizedEmail), eq(schema.emailOtps.code, code.trim())))
          .orderBy(desc(schema.emailOtps.createdAt))
          .limit(1);

        if (rows.length > 0 && new Date(rows[0].expiresAt).getTime() > Date.now()) {
          isValid = true;
          await db.update(schema.emailOtps).set({ verified: true }).where(eq(schema.emailOtps.id, rows[0].id));
        }
      } catch (err) {
        console.warn("DB OTP verify notice:", err);
      }
    }

    if (!isValid) {
      const memOtp = inMemoryStore.otps.get(normalizedEmail);
      if (memOtp && memOtp.code === code.trim() && memOtp.expiresAt > Date.now()) {
        isValid = true;
        memOtp.verified = true;
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid or expired verification code." }, { status: 400 });
    }

    let user: any = null;
    if (db) {
      try {
        const found = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
        if (found.length > 0) {
          user = found[0];
        }
      } catch (err) {
        console.warn("DB user find notice:", err);
      }
    }

    if (!user) {
      user = inMemoryStore.users.get(normalizedEmail);
      if (!user) {
        return NextResponse.json({
          success: false,
          error: "This user is not registered. Please create an account first.",
        }, { status: 404 });
      }
    }

    const updatedStatus = "PENDING_ADMIN_APPROVAL";
    if (db) {
      try {
        await db
          .update(schema.users)
          .set({ accountStatus: updatedStatus, emailVerifiedAt: new Date() })
          .where(eq(schema.users.email, normalizedEmail));
      } catch (err) {
        console.warn("DB status update notice:", err);
      }
    }
    if (user && inMemoryStore.users.has(normalizedEmail)) {
      const existing = inMemoryStore.users.get(normalizedEmail)!;
      existing.accountStatus = updatedStatus;
      existing.name = existing.name || (name?.trim() || normalizedEmail.split("@")[0]);
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. Your account is awaiting administrator approval.",
      data: { status: updatedStatus },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Verification failed." }, { status: 500 });
  }
}
