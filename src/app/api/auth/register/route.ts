import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { and, eq, gte, or } from "drizzle-orm";

const DISPOSABLE_EMAIL_DOMAINS = new Set(["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "yopmail.com", "sharklasers.com"]);
const NAME_PATTERN = /[^a-zA-Z\s.'-]/;

export async function POST(req: Request) {
  try {
    const { name, email, password, sessionId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide your full name, email, and password." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    const domain = normalizedEmail.split("@")[1] || "";
    const signals: string[] = [];
    let riskScore = 0;
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) { signals.push("disposable_email_domain"); riskScore += 60; }
    if (NAME_PATTERN.test(normalizedName) || normalizedName.length < 3) { signals.push("suspicious_name"); riskScore += 25; }
    if (/^(test|admin|user|asdf|qwerty)/i.test(normalizedEmail) || /\+/.test(normalizedEmail)) { signals.push("suspicious_email_pattern"); riskScore += 20; }
    let riskStatus = "CLEAR";
    const accountStatus = "EMAIL_UNVERIFIED";
    const db = getDb();
    let existingUser: any = null;

    if (db) {
      try {
        const recentCutoff = new Date(Date.now() - 60 * 60 * 1000);
        const identityChecks = [
          ...(ipAddress !== "unknown" ? [eq(schema.registrationRiskEvents.ipAddress, ipAddress)] : []),
          ...(typeof sessionId === "string" && sessionId ? [eq(schema.registrationRiskEvents.sessionId, sessionId)] : []),
        ];
        const recentRiskEvents = identityChecks.length > 0
          ? await db.select({ id: schema.registrationRiskEvents.id }).from(schema.registrationRiskEvents).where(and(or(...identityChecks), gte(schema.registrationRiskEvents.createdAt, recentCutoff)))
          : [];
        if (recentRiskEvents.length >= 3) { signals.push("repeated_ip_or_session_signups"); riskScore += 45; }
        if (riskScore >= 60) riskStatus = "SPAM_SUSPECTED";
        else if (riskScore >= 25) riskStatus = "REVIEW_REQUIRED";
        const found = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
        if (found.length > 0) existingUser = found[0];
      } catch (err) {
        console.warn("DB query error on register:", err);
      }
    } else {
      existingUser = inMemoryStore.users.get(normalizedEmail);
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const newUserObj = {
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
      role: "customer",
      accountStatus,
      riskStatus,
      riskScore,
      riskSignals: signals,
    };

    if (db) {
      try {
        await db.insert(schema.users).values({
          id: userId,
          name: normalizedName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: "customer",
          accountStatus,
          riskStatus,
          riskScore,
          riskSignals: signals,
          registrationIp: ipAddress,
          registrationSessionId: typeof sessionId === "string" ? sessionId.slice(0, 128) : null,
        });
        await db.insert(schema.registrationRiskEvents).values({ email: normalizedEmail, ipAddress, sessionId: typeof sessionId === "string" ? sessionId.slice(0, 128) : null, eventType: "registration", riskScore, signals });
      } catch (err) {
        console.warn("Could not insert user into DB, using fallback memory:", err);
        inMemoryStore.users.set(normalizedEmail, {
          ...newUserObj,
          passwordHash: hashedPassword,
          createdAt: new Date(),
        });
      }
    } else {
      inMemoryStore.users.set(normalizedEmail, {
        ...newUserObj,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: riskStatus === "SPAM_SUSPECTED" ? "Registration received. Additional review is required after email verification." : "Account created. Please verify your email to continue.",
      data: { user: newUserObj },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
