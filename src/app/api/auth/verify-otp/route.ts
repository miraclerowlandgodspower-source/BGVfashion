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

    // Get or create user
    let user: any = null;
    if (db) {
      try {
        const found = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
        if (found.length > 0) {
          user = found[0];
        } else {
          // Auto create user upon OTP verification
          const newId = crypto.randomUUID();
          await db.insert(schema.users).values({
            id: newId as any,
            name: name?.trim() || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            passwordHash: "otp_authenticated",
            role: "customer",
          });
          user = { id: newId, name: name?.trim() || normalizedEmail.split("@")[0], email: normalizedEmail, role: "customer" };
        }
      } catch (err) {
        console.warn("DB user find/create notice:", err);
      }
    }

    if (!user) {
      user = inMemoryStore.users.get(normalizedEmail);
      if (!user) {
        user = {
          id: crypto.randomUUID(),
          name: name?.trim() || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          role: "customer",
        };
        inMemoryStore.users.set(normalizedEmail, { ...user, passwordHash: "otp_authenticated", createdAt: new Date() });
      }
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "customer",
    };

    const token = await createSessionToken(userObj);

    const response = NextResponse.json({
      success: true,
      message: "Verified and signed in successfully!",
      data: { user: userObj },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Verification failed." }, { status: 500 });
  }
}
