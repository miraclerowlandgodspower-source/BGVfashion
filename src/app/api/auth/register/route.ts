import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

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
    const db = getDb();
    let existingUser: any = null;

    if (db) {
      try {
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
      name: name.trim(),
      email: normalizedEmail,
      role: "customer",
    };

    if (db) {
      try {
        await db.insert(schema.users).values({
          id: userId,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: "customer",
        });
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

    const token = await createSessionToken(newUserObj);

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      data: { user: newUserObj },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
