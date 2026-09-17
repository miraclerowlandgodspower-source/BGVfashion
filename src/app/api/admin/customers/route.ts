import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    let customers: any[] = [];

    if (db) {
      try {
        const rows = await db.select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
        }).from(schema.users).orderBy(desc(schema.users.createdAt));
        customers = rows;
      } catch (err) {
        console.warn("DB customers error:", err);
      }
    }

    if (customers.length === 0) {
      customers = Array.from(inMemoryStore.users.values()).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      data: { customers },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}
