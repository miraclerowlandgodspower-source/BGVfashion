import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/types";

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || "bgv_super_secret_jwt_key_fashion_2026_production_safe_token";
  return new TextEncoder().encode(secret);
};

export const COOKIE_NAME = "bgv_auth_token";

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: { id: string; email: string; name: string; role?: string }): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "customer",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<{ userId: string; email: string; name: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || "customer",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role as "customer" | "admin",
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return user;
}

export async function checkAdminApiAccess(): Promise<{
  authorized: boolean;
  user?: User;
  errorResponse?: NextResponse;
}> {
  const user = await getSessionUser();
  if (!user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized access: Please sign in to the Admin Portal." },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "admin") {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      ),
    };
  }
  return { authorized: true, user };
}
