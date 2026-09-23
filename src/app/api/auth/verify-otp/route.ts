import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createSessionToken, COOKIE_NAME, getCookieOptions } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/bgv-email";

export async function POST(req: Request) {
  try {
    const { email, code, name, purpose = "signup" } = await req.json();

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
        } else {
          const latest = await db.select().from(schema.emailOtps).where(eq(schema.emailOtps.email, normalizedEmail)).orderBy(desc(schema.emailOtps.createdAt)).limit(1);
          if (latest[0]) {
            const attempts = latest[0].attempts + 1;
            await db.update(schema.emailOtps).set({ attempts }).where(eq(schema.emailOtps.id, latest[0].id));
            if (attempts >= 5) {
              const userRows = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
              if (userRows[0]) {
                const signals = [...(userRows[0].riskSignals || []), "repeated_failed_otp_attempts"];
                await db.update(schema.users).set({ riskStatus: "REVIEW_REQUIRED", riskScore: Math.max(userRows[0].riskScore, 40), riskSignals: [...new Set(signals)] }).where(eq(schema.users.id, userRows[0].id));
              }
            }
          }
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

    if (purpose === "login" && user.role !== "admin" && user.accountStatus !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Your account is not active for sign in." }, { status: 403 });
    }

    const updatedStatus = purpose === "login" ? user.accountStatus : "PENDING_ADMIN_APPROVAL";
    if (db) {
      try {
        await db.update(schema.users).set({ ...(purpose === "login" ? {} : { accountStatus: updatedStatus }), emailVerifiedAt: new Date() }).where(eq(schema.users.email, normalizedEmail));
      } catch (err) { console.warn("DB status update notice:", err); }
    }
    if (user && inMemoryStore.users.has(normalizedEmail)) {
      const existing = inMemoryStore.users.get(normalizedEmail)!;
      if (purpose !== "login") existing.accountStatus = updatedStatus;
      existing.name = existing.name || (name?.trim() || normalizedEmail.split("@")[0]);
    }

    if (purpose !== "login") {
      sendWelcomeEmail(normalizedEmail, user.name || name).catch((err) => {
        console.warn("Welcome email delivery notice:", err);
      });
    }

    const response = NextResponse.json({
      success: true,
      message: purpose === "login" ? "Email code verified." : "Email verified successfully. Your account is awaiting administrator approval.",
      data: {
        status: updatedStatus,
        user: { id: user.id, name: user.name, email: user.email, role: user.role || "customer" },
      },
    });
    if (purpose === "login") response.cookies.set({ name: COOKIE_NAME, value: await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role || "customer" }), ...getCookieOptions() });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed." }, { status: 500 });
  }
}
