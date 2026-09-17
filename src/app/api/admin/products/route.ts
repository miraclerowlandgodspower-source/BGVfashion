import { NextResponse } from "next/server";
import { getDb, inMemoryStore, getProducts } from "@/lib/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ success: true, data: { products } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department, category, price, description, sizes, colors, sheet = "women.png", quadrant = 0 } = body;

    if (!name || !department || !category || !price) {
      return NextResponse.json({ success: false, error: "Name, department, category, and price are required." }, { status: 400 });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `prod-${Date.now()}`;
    const newProduct = {
      id,
      name: name.trim(),
      department,
      category,
      price: Number(price),
      sheet,
      quadrant: Number(quadrant) as 0 | 1 | 2 | 3,
      colors: Array.isArray(colors) ? colors : ["#40152f", "#1c191a"],
      sizes: Array.isArray(sizes) ? sizes : ["S", "M", "L", "XL"],
      description: description?.trim() || "Handcrafted contemporary garment.",
      inStock: true,
      featured: false,
    };

    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.products).values(newProduct);
      } catch (err) {
        console.warn("DB product insert error:", err);
      }
    }

    inMemoryStore.products.unshift(newProduct);

    return NextResponse.json({
      success: true,
      message: "Product added to catalogue successfully!",
      data: { product: newProduct },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, inStock, featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      try {
        await db
          .update(schema.products)
          .set({
            ...(name && { name }),
            ...(price !== undefined && { price: Number(price) }),
            ...(inStock !== undefined && { inStock }),
            ...(featured !== undefined && { featured }),
          })
          .where(eq(schema.products.id, id));
      } catch (err) {
        console.warn("DB product update error:", err);
      }
    }

    const item = inMemoryStore.products.find((p) => p.id === id);
    if (item) {
      if (name) item.name = name;
      if (price !== undefined) item.price = Number(price);
      if (inStock !== undefined) item.inStock = inStock;
      if (featured !== undefined) item.featured = featured;
    }

    return NextResponse.json({ success: true, message: "Product updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      try {
        await db.delete(schema.products).where(eq(schema.products.id, id));
      } catch (err) {
        console.warn("DB product delete error:", err);
      }
    }

    inMemoryStore.products = inMemoryStore.products.filter((p) => p.id !== id);

    return NextResponse.json({ success: true, message: "Product deleted from catalogue." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
