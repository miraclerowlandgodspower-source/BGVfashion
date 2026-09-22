import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { checkAdminApiAccess } from "@/lib/auth";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const rows = await db.select().from(schema.visitorAnalytics).orderBy(desc(schema.visitorAnalytics.lastActivityAt));
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeRows = rows.filter((row) => now - row.lastActivityAt.getTime() <= 5 * 60 * 1000);
    const todayRows = rows.filter((row) => row.createdAt >= todayStart);
    const countBy = (values: Array<string | null>) => values.reduce<Record<string, number>>((result, value) => {
      const key = value || "Unknown";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        visitors: rows.slice(0, 200),
        activeVisitors: activeRows.length,
        visitorsToday: todayRows.length,
        deviceBreakdown: countBy(rows.map((row) => row.deviceType)),
        browserBreakdown: countBy(rows.map((row) => row.browser)),
      },
    });
  } catch (error) {
    console.error("Admin visitors query failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load visitor analytics." }, { status: 500 });
  }
}
