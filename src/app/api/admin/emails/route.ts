import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { checkAdminApiAccess } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";
import {
  sendBrandStoryEmail,
  sendCartReminderEmail,
  sendInactiveUserEmail,
} from "@/lib/bgv-email";

type CampaignType = "cart_reminder" | "inactive" | "brand_story";

const MAX_BATCH_SIZE = 50;

function isCampaignType(value: unknown): value is CampaignType {
  return value === "cart_reminder" || value === "inactive" || value === "brand_story";
}

export async function POST(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;

  try {
    const body = await req.json().catch(() => ({}));
    const campaign = body?.campaign;
    const testEmail = typeof body?.testEmail === "string" ? body.testEmail.trim().toLowerCase() : "";

    if (!isCampaignType(campaign)) {
      return NextResponse.json({
        success: false,
        error: "Choose a valid email campaign: cart_reminder, inactive, or brand_story.",
      }, { status: 400 });
    }

    if (testEmail) {
      let sent = false;
      if (campaign === "cart_reminder") sent = await sendCartReminderEmail(testEmail, "BGV Customer", 1);
      if (campaign === "inactive") sent = await sendInactiveUserEmail(testEmail, "BGV Customer");
      if (campaign === "brand_story") sent = await sendBrandStoryEmail(testEmail, "BGV Customer");

      return NextResponse.json({
        success: sent,
        message: sent ? `Test ${campaign} email sent to ${testEmail}.` : "Test email could not be sent. Check EMAIL_API_KEY and Resend domain verification.",
        data: { attempted: 1, sent: sent ? 1 : 0, mode: "test" },
      }, { status: sent ? 200 : 502 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database is not available for campaign recipients." }, { status: 503 });
    }

    let recipients: Array<{ email: string; name: string | null; itemCount?: number }> = [];

    if (campaign === "cart_reminder") {
      const rows = await db
        .select({
          email: schema.users.email,
          name: schema.users.name,
          itemId: schema.cartItems.id,
        })
        .from(schema.cartItems)
        .leftJoin(schema.users, eq(schema.cartItems.userId, schema.users.id))
        .where(and(eq(schema.users.accountStatus, "ACTIVE")))
        .limit(200);

      const grouped = new Map<string, { email: string; name: string | null; itemCount: number }>();
      for (const row of rows) {
        if (!row.email) continue;
        const current = grouped.get(row.email) || { email: row.email, name: row.name, itemCount: 0 };
        current.itemCount += 1;
        grouped.set(row.email, current);
      }
      recipients = Array.from(grouped.values()).slice(0, MAX_BATCH_SIZE);
    }

    if (campaign === "inactive") {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(eq(schema.users.accountStatus, "ACTIVE"), lt(schema.users.lastLoginAt, twoWeeksAgo)))
        .limit(MAX_BATCH_SIZE);
      recipients = rows;
    }

    if (campaign === "brand_story") {
      const rows = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.accountStatus, "ACTIVE"))
        .limit(MAX_BATCH_SIZE);
      recipients = rows;
    }

    let sent = 0;
    for (const recipient of recipients) {
      let ok = false;
      if (campaign === "cart_reminder") ok = await sendCartReminderEmail(recipient.email, recipient.name, recipient.itemCount || 1);
      if (campaign === "inactive") ok = await sendInactiveUserEmail(recipient.email, recipient.name);
      if (campaign === "brand_story") ok = await sendBrandStoryEmail(recipient.email, recipient.name);
      if (ok) sent += 1;
    }

    return NextResponse.json({
      success: true,
      message: `${campaign} campaign completed. ${sent}/${recipients.length} emails sent.`,
      data: { attempted: recipients.length, sent, mode: "batch", maxBatchSize: MAX_BATCH_SIZE },
    });
  } catch (error) {
    console.error("Admin email campaign failed:", error);
    return NextResponse.json({ success: false, error: "Email campaign failed." }, { status: 500 });
  }
}
