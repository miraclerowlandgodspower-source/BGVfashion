import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { comparePassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();
    let user: any = null;

    if (db) {
      try {
        const found = await db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
        if (found.length > 0) user = found[0];
      } catch (err) {
        console.warn("DB login query error:", err);
      }
    }

    if (!user) {
      user = inMemoryStore.users.get(normalizedEmail);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password." },
        { status: 401 }
      );
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
      message: "Welcome back!",
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
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}
