import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, inMemoryStore, getProductById } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    const db = getDb();
    let items: any[] = [];

    if (user && db) {
      try {
        const rows = await db.select().from(schema.cartItems).where(eq(schema.cartItems.userId, user.id as any));
        for (const row of rows) {
          const product = await getProductById(row.productId);
          if (product) {
            items.push({
              id: row.id,
              productId: row.productId,
              size: row.size,
              quantity: row.quantity,
              product,
            });
          }
        }
      } catch (err) {
        console.warn("DB error fetching cart:", err);
      }
    } else if (user) {
      const userCart = inMemoryStore.cart.get(user.id) || [];
      for (const item of userCart) {
        const product = await getProductById(item.productId);
        if (product) {
          items.push({ ...item, product });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { items },
    });
  } catch (error: any) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { productId, size, quantity = 1 } = await req.json();

    if (!productId || !size) {
      return NextResponse.json(
        { success: false, error: "Product ID and size are required" },
        { status: 400 }
      );
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.sizes.includes(size)) {
      return NextResponse.json(
        { success: false, error: "Invalid size selected for this piece" },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const db = getDb();

    if (user && db) {
      try {
        const existing = await db
          .select()
          .from(schema.cartItems)
          .where(and(eq(schema.cartItems.userId, user.id as any), eq(schema.cartItems.productId, productId), eq(schema.cartItems.size, size)))
          .limit(1);

        if (existing.length > 0) {
          const newQty = Math.min(10, existing[0].quantity + quantity);
          await db
            .update(schema.cartItems)
            .set({ quantity: newQty, updatedAt: new Date() })
            .where(eq(schema.cartItems.id, existing[0].id));
        } else {
          await db.insert(schema.cartItems).values({
            userId: user.id as any,
            productId,
            size,
            quantity: Math.min(10, quantity),
          });
        }
      } catch (err) {
        console.warn("DB error updating cart:", err);
      }
    } else if (user) {
      let userCart = inMemoryStore.cart.get(user.id) || [];
      const existing = userCart.find((i) => i.productId === productId && i.size === size);
      if (existing) {
        existing.quantity = Math.min(10, existing.quantity + quantity);
      } else {
        userCart.push({ id: crypto.randomUUID(), userId: user.id, productId, size, quantity: Math.min(10, quantity) });
      }
      inMemoryStore.cart.set(user.id, userCart);
    }

    return NextResponse.json({
      success: true,
      message: `${product.name} added to your bag.`,
      data: { productId, size, quantity },
    });
  } catch (error: any) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to bag" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { productId, size, quantity } = await req.json();
    const user = await getSessionUser();
    const db = getDb();

    if (user && db) {
      try {
        if (quantity <= 0) {
          await db
            .delete(schema.cartItems)
            .where(and(eq(schema.cartItems.userId, user.id as any), eq(schema.cartItems.productId, productId), eq(schema.cartItems.size, size)));
        } else {
          await db
            .update(schema.cartItems)
            .set({ quantity: Math.min(10, quantity), updatedAt: new Date() })
            .where(and(eq(schema.cartItems.userId, user.id as any), eq(schema.cartItems.productId, productId), eq(schema.cartItems.size, size)));
        }
      } catch (err) {
        console.warn("DB error updating cart quantity:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update quantity" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const size = searchParams.get("size");

    const user = await getSessionUser();
    const db = getDb();

    if (user && db && productId && size) {
      try {
        await db
          .delete(schema.cartItems)
          .where(and(eq(schema.cartItems.userId, user.id as any), eq(schema.cartItems.productId, productId), eq(schema.cartItems.size, size)));
      } catch (err) {
        console.warn("DB error removing from cart:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Item removed from bag." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to remove item" }, { status: 500 });
  }
}
