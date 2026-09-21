import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const db = getDb();
    const settingsObj: Record<string, string> = {
      store_name: "BGV Fashion Atelier",
      atelier_location: "Ojo, Lagos, Nigeria",
      contact_email: "concierge@bgvfashion.com",
      contact_phone: "+234 812 345 6789",
      default_carrier: "GIG Logistics",
      currency: "NGN",
      shipping_fee_lagos: "2500",
      shipping_fee_national: "5000",
      shipping_fee_international: "25000",
    };

    if (db) {
      try {
        const rows = await db.select().from(schema.storeSettings);
        for (const row of rows) {
          settingsObj[row.key] = row.value;
        }
      } catch (err) {
        console.warn("DB settings fetch error:", err);
      }
    }

    for (const [k, v] of inMemoryStore.settings.entries()) {
      if (!settingsObj[k]) {
        settingsObj[k] = v;
      }
    }

    return NextResponse.json({
      success: true,
      data: { settings: settingsObj },
    });
  } catch (error: any) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { authorized, user, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { settings, newPassword } = await req.json();

    const db = getDb();

    // If updating admin password
    if (newPassword && newPassword.length >= 8) {
      const hashed = await hashPassword(newPassword);
      if (db && user?.id) {
        try {
          await db
            .update(schema.users)
            .set({ passwordHash: hashed })
            .where(eq(schema.users.id, user.id as any));
        } catch (err) {
          console.warn("DB password update error:", err);
        }
      }
      if (user?.email) {
        const memUser = inMemoryStore.users.get(user.email);
        if (memUser) {
          memUser.passwordHash = hashed;
        }
      }
    }

    // If updating store settings
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string") {
          inMemoryStore.settings.set(key, value);
          if (db) {
            try {
              await db
                .insert(schema.storeSettings)
                .values({ key, value })
                .onConflictDoUpdate({
                  target: schema.storeSettings.key,
                  set: { value, updatedAt: new Date() },
                });
            } catch (err) {
              console.warn(`DB update setting ${key} error:`, err);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Store configuration updated successfully.",
    });
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
