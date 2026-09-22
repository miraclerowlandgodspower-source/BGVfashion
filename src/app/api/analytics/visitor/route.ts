import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

function parseUserAgent(userAgent: string) {
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Other";
  const deviceType = /Mobi|Android/i.test(userAgent) ? "Mobile" : /Tablet|iPad/i.test(userAgent) ? "Tablet" : "Desktop";
  const os = /Windows/i.test(userAgent) ? "Windows" : /Mac OS|Macintosh/i.test(userAgent) ? "macOS" : /Android/i.test(userAgent) ? "Android" : /iPhone|iPad/i.test(userAgent) ? "iOS" : /Linux/i.test(userAgent) ? "Linux" : "Other";
  return { browser, deviceType, os };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const currentPage = typeof body.currentPage === "string" ? body.currentPage.slice(0, 500) : "/";
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(sessionId)) {
      return NextResponse.json({ success: false, error: "Invalid visitor session." }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    const user = await getSessionUser();
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer")?.slice(0, 500) || null;
    const parsed = parseUserAgent(userAgent);

    await db.insert(schema.visitorAnalytics).values({
      sessionId,
      userId: user?.id || null,
      entryPage: currentPage,
      currentPage,
      referrer,
      ...parsed,
    }).onConflictDoUpdate({
      target: schema.visitorAnalytics.sessionId,
      set: { userId: user?.id || null, currentPage, lastActivityAt: new Date(), browser: parsed.browser, deviceType: parsed.deviceType, os: parsed.os },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visitor tracking error:", error);
    return NextResponse.json({ success: false, error: "Unable to record visitor activity." }, { status: 500 });
  }
}