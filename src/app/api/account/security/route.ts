import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, hashPassword, comparePassword } from "@/lib/auth";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ success: true, data: { passkeys: [], passkeysConfigured: false, trustedDevices: [], trustedDevicesConfigured: false } });
}

export async function PATCH(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 });

  try {
    const body = await req.json();
    const db = getDb();
    const updates: Record<string, string> = {};

    if (typeof body.name === "string" && body.name.trim().length >= 3) updates.name = body.name.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();

    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || typeof body.newPassword !== "string" || body.newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Current password and a new password of at least 8 characters are required." }, { status: 400 });
      }
      let passwordHash: string | null = null;
      if (db) {
        const rows = await db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, sessionUser.id)).limit(1);
        passwordHash = rows[0]?.passwordHash || null;
      } else {
        const memoryUser = Array.from(inMemoryStore.users.values()).find((candidate: any) => candidate.id === sessionUser.id) as any;
        passwordHash = memoryUser?.passwordHash || null;
      }
      if (!passwordHash || !(await comparePassword(body.currentPassword, passwordHash))) {
        return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 });
      }
      updates.passwordHash = await hashPassword(body.newPassword);
    }

    if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: "No account changes were provided." }, { status: 400 });

    if (db) await db.update(schema.users).set(updates as any).where(eq(schema.users.id, sessionUser.id));
    for (const [email, candidate] of inMemoryStore.users.entries()) {
      if ((candidate as any).id === sessionUser.id) Object.assign(candidate, updates);
      inMemoryStore.users.set(email, candidate);
    }

    return NextResponse.json({ success: true, message: "Account security settings updated." });
  } catch (error) {
    console.error("Account security update failed:", error);
    return NextResponse.json({ success: false, error: "Could not update account security settings." }, { status: 500 });
  }
}
