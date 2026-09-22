import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { checkAdminApiAccess } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";

const allowedActions = new Set(["approve", "reject", "spam", "suspend", "reactivate"]);

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const rows = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      accountStatus: schema.users.accountStatus,
      riskStatus: schema.users.riskStatus,
      riskScore: schema.users.riskScore,
      riskSignals: schema.users.riskSignals,
      registrationIp: schema.users.registrationIp,
      registrationSessionId: schema.users.registrationSessionId,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      createdAt: schema.users.createdAt,
      approvedAt: schema.users.approvedAt,
      rejectionReason: schema.users.rejectionReason,
    }).from(schema.users).where(status === "review" ? inArray(schema.users.riskStatus, ["REVIEW_REQUIRED", "SPAM_SUSPECTED"]) : status === "approved" ? eq(schema.users.accountStatus, "ACTIVE") : eq(schema.users.accountStatus, status === "pending" ? "PENDING_ADMIN_APPROVAL" : status.toUpperCase())).orderBy(desc(schema.users.createdAt));
    return NextResponse.json({ success: true, data: { users: rows } });
  } catch (error) {
    console.error("Approval list failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load approval queue." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { authorized, errorResponse, user: admin } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;
  try {
    const { userId, action, reason } = await req.json();
    if (!userId || !allowedActions.has(action)) return NextResponse.json({ success: false, error: "A valid user and approval action are required." }, { status: 400 });
    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const found = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!found[0]) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    if (found[0].role === "admin" && action !== "reactivate") return NextResponse.json({ success: false, error: "Administrator accounts cannot be changed from this queue." }, { status: 400 });
    let updates: any = {};
    if (action === "approve") updates = { accountStatus: "ACTIVE", riskStatus: "CLEAR", approvedAt: new Date(), approvedBy: admin!.id, rejectionReason: null };
    if (action === "reject") updates = { accountStatus: "REJECTED", rejectionReason: typeof reason === "string" ? reason.slice(0, 500) : "Rejected by administrator" };
    if (action === "spam") updates = { accountStatus: "REJECTED", riskStatus: "SPAM_SUSPECTED", rejectionReason: typeof reason === "string" ? reason.slice(0, 500) : "Marked as spam by administrator" };
    if (action === "suspend") updates = { accountStatus: "SUSPENDED", rejectionReason: typeof reason === "string" ? reason.slice(0, 500) : "Suspended by administrator" };
    if (action === "reactivate") updates = { accountStatus: "ACTIVE", rejectionReason: null, approvedAt: found[0].approvedAt || new Date(), approvedBy: found[0].approvedBy || admin!.id };
    await db.update(schema.users).set(updates).where(eq(schema.users.id, userId));
    await db.insert(schema.adminAuditLogs).values({ adminId: admin!.id, action: `user_${action}`, target: `user:${userId}`, details: typeof reason === "string" ? reason.slice(0, 500) : null });
    return NextResponse.json({ success: true, message: `User ${action} action completed.` });
  } catch (error) {
    console.error("Approval action failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update user approval status." }, { status: 500 });
  }
}
