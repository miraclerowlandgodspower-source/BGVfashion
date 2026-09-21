import { NextResponse } from "next/server";
import { getDb, inMemoryStore } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();

    const db = getDb();
    let customers: any[] = [];

    if (db) {
      try {
        const userRows = await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
            phone: schema.users.phone,
            role: schema.users.role,
            createdAt: schema.users.createdAt,
          })
          .from(schema.users)
          .orderBy(desc(schema.users.createdAt));

        for (const u of userRows) {
          // Get customer's orders
          const userOrders = await db
            .select()
            .from(schema.orders)
            .where(eq(schema.orders.customerEmail, u.email));

          // Get customer's addresses
          const userAddresses = await db
            .select()
            .from(schema.customerAddresses)
            .where(eq(schema.customerAddresses.userId, u.id));

          customers.push({
            ...u,
            createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
            orderCount: userOrders.length,
            totalSpent: userOrders
              .filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "payment_confirmed")
              .reduce((sum, o) => sum + o.totalAmount, 0),
            addresses: userAddresses,
            orders: userOrders.map((o) => ({
              orderNumber: o.orderNumber,
              totalAmount: o.totalAmount,
              status: o.status,
              createdAt: o.createdAt ? o.createdAt.toISOString() : undefined,
            })),
          });
        }
      } catch (err) {
        console.warn("DB customers query notice (using fallback store):", err);
      }
    }

    if (customers.length === 0) {
      customers = Array.from(inMemoryStore.users.values()).map((u) => {
        const userOrders = Array.from(inMemoryStore.orders.values()).filter(
          (o) => o.customerEmail?.toLowerCase() === u.email?.toLowerCase()
        );
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "+234 812 000 0000",
          role: u.role,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          addresses: inMemoryStore.customerAddresses.get(u.id) || [],
          orders: userOrders.map((o) => ({
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt,
          })),
        };
      });
    }

    if (search) {
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: { customers },
    });
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers." },
      { status: 500 }
    );
  }
}
