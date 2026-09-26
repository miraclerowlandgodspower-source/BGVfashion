import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { createSessionToken, getCookieOptions, hashPassword, COOKIE_NAME } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/bgv-email";

export const runtime = "nodejs";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Google sign-in is not configured yet." }, { status: 503 });
    }
    if (!credential || typeof credential !== "string") {
      return NextResponse.json({ success: false, error: "Missing Google credential." }, { status: 400 });
    }

    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });

    const email = typeof payload.email === "string" ? payload.email.toLowerCase().trim() : "";
    const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : "BGV Client";
    const emailVerified = payload.email_verified === true || payload.email_verified === "true";

    if (!email || !emailVerified || !payload.sub) {
      return NextResponse.json({ success: false, error: "Google could not verify this account." }, { status: 401 });
    }

    const db = getDb();
    let user: any = null;
    let isNewUser = false;

    if (db) {
      const found = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (found.length) user = found[0];
    } else {
      user = inMemoryStore.users.get(email) || null;
    }

    if (user && ["SUSPENDED", "REJECTED"].includes(user.accountStatus)) {
      return NextResponse.json({ success: false, error: "This BGV account is not available. Contact support for help." }, { status: 403 });
    }

    if (!user) {
      isNewUser = true;
      const id = crypto.randomUUID();
      const passwordHash = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
      const now = new Date();

      const newUser = {
        id,
        name,
        email,
        passwordHash,
        role: "customer",
        accountStatus: "ACTIVE",
        riskStatus: "CLEAR",
        riskScore: 0,
        riskSignals: ["google_verified_identity"],
        emailVerifiedAt: now,
        lastLoginAt: now,
        createdAt: now,
      };

      if (db) {
        const inserted = await db.insert(schema.users).values({
          id,
          name,
          email,
          passwordHash,
          role: "customer",
          accountStatus: "ACTIVE",
          riskStatus: "CLEAR",
          riskScore: 0,
          riskSignals: ["google_verified_identity"],
          emailVerifiedAt: now,
          lastLoginAt: now,
        }).returning();
        user = inserted[0];
      } else {
        inMemoryStore.users.set(email, newUser);
        user = newUser;
      }
    } else if (db && user.role !== "admin" && ["EMAIL_UNVERIFIED", "PENDING_ADMIN_APPROVAL"].includes(user.accountStatus)) {
      const updated = await db.update(schema.users).set({
        accountStatus: "ACTIVE",
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
        lastLoginAt: new Date(),
      }).where(eq(schema.users.id, user.id)).returning();
      user = updated[0] || user;
    } else if (db) {
      await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "customer",
    };

    const token = await createSessionToken(userObj);
    const response = NextResponse.json({ success: true, data: { user: userObj, isNewUser } });
    response.cookies.set({ name: COOKIE_NAME, value: token, ...getCookieOptions() });

    if (isNewUser) {
      sendWelcomeEmail(email, name).catch(() => undefined);
    }

    return response;
  } catch (error: any) {
    console.error("Google auth error:", error);
    return NextResponse.json({ success: false, error: "Google sign-in could not be completed." }, { status: 401 });
  }
}
