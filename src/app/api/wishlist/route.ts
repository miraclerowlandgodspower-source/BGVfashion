import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, inMemoryStore, getProductById } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    const db = getDb();
    let productIds: string[] = [];

    if (user && db) {
      try {
        const rows = await db
          .select()
          .from(schema.wishlistItems)
          .where(eq(schema.wishlistItems.userId, user.id as any));
        productIds = rows.map((r) => r.productId);
      } catch (err) {
        console.warn("DB error fetching wishlist:", err);
      }
    } else if (user) {
      const set = inMemoryStore.wishlist.get(user.id);
      if (set) productIds = Array.from(set);
    }

    const items = [];
    for (const pid of productIds) {
      const product = await getProductById(pid);
      if (product) items.push(product);
    }

    return NextResponse.json({
      success: true,
      data: { productIds, items },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    const user = await getSessionUser();
    const db = getDb();
    let isWished = false;

    if (user && db) {
      try {
        const existing = await db
          .select()
          .from(schema.wishlistItems)
          .where(and(eq(schema.wishlistItems.userId, user.id as any), eq(schema.wishlistItems.productId, productId)))
          .limit(1);

        if (existing.length > 0) {
          await db
            .delete(schema.wishlistItems)
            .where(eq(schema.wishlistItems.id, existing[0].id));
          isWished = false;
        } else {
          await db.insert(schema.wishlistItems).values({
            userId: user.id as any,
            productId,
          });
          isWished = true;
        }
      } catch (err) {
        console.warn("DB error toggling wishlist:", err);
      }
    } else if (user) {
      let set = inMemoryStore.wishlist.get(user.id);
      if (!set) {
        set = new Set();
        inMemoryStore.wishlist.set(user.id, set);
      }
      if (set.has(productId)) {
        set.delete(productId);
        isWished = false;
      } else {
        set.add(productId);
        isWished = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: { isWished, productId },
      message: isWished ? "Saved to your wishlist." : "Removed from your wishlist.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update wishlist" }, { status: 500 });
  }
}
