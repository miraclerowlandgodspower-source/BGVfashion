import { NextResponse } from "next/server";
import { getDb, inMemoryStore, getProducts } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Product } from "@/types";

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const department = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;

    const products = await getProducts({
      search,
      category,
      department,
      status,
      includeInactive: true,
    });

    return NextResponse.json({ success: true, data: { products } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products catalogue." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      name,
      department = "Women",
      category = "Dresses",
      price,
      salePrice = null,
      description,
      sizes = ["XS", "S", "M", "L", "XL"],
      colors = ["#391b2e", "#1b191a"],
      stockQuantity = 10,
      sku,
      image = null,
      sheet = "women.png",
      quadrant = 0,
      status = "active",
      featured = false,
      newArrival = false,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: "Product name and price are required." },
        { status: 400 }
      );
    }

    const id =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `bgv-${Date.now()}`;

    const parsedPrice = Number(price);
    const parsedSalePrice = salePrice ? Number(salePrice) : null;
    const parsedStock = Number(stockQuantity) >= 0 ? Number(stockQuantity) : 0;
    const generatedSku =
      sku?.trim() || `BGV-${department.substring(0, 1).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct: Product = {
      id,
      name: name.trim(),
      department: department as "Women" | "Men" | "Unisex",
      category: category.trim(),
      price: parsedPrice,
      salePrice: parsedSalePrice,
      sku: generatedSku,
      stockQuantity: parsedStock,
      sheet: sheet || "women.png",
      quadrant: Number(quadrant) as 0 | 1 | 2 | 3,
      image: image?.trim() || null,
      colors: Array.isArray(colors) ? colors : colors ? [colors] : ["#391b2e"],
      sizes: Array.isArray(sizes) ? sizes : sizes ? [sizes] : ["S", "M", "L"],
      description: description?.trim() || "Handcrafted contemporary fashion piece from the BGV Atelier.",
      inStock: parsedStock > 0,
      featured: Boolean(featured),
      newArrival: Boolean(newArrival),
      status: (status as any) || "active",
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.products).values({
          id: newProduct.id,
          name: newProduct.name,
          department: newProduct.department,
          category: newProduct.category,
          price: newProduct.price,
          salePrice: newProduct.salePrice,
          sku: newProduct.sku,
          stockQuantity: newProduct.stockQuantity,
          sheet: newProduct.sheet || "women.png",
          quadrant: newProduct.quadrant ?? 0,
          image: newProduct.image,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          description: newProduct.description,
          inStock: newProduct.inStock ?? true,
          featured: newProduct.featured ?? false,
          newArrival: newProduct.newArrival ?? false,
          status: newProduct.status || "active",
        });
      } catch (err) {
        console.warn("DB product insert error (falling back to memory):", err);
      }
    }

    inMemoryStore.products.unshift(newProduct);

    return NextResponse.json({
      success: true,
      message: "Product created and published to catalogue successfully!",
      data: { product: newProduct },
    });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const body = await req.json();
    const {
      id,
      name,
      department,
      category,
      price,
      salePrice,
      sku,
      stockQuantity,
      sizes,
      colors,
      description,
      inStock,
      featured,
      newArrival,
      status,
      image,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (department !== undefined) updates.department = department;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = Number(price);
    if (salePrice !== undefined) updates.salePrice = salePrice ? Number(salePrice) : null;
    if (sku !== undefined) updates.sku = sku;
    if (stockQuantity !== undefined) {
      updates.stockQuantity = Number(stockQuantity);
      updates.inStock = Number(stockQuantity) > 0;
    } else if (inStock !== undefined) {
      updates.inStock = inStock;
    }
    if (sizes !== undefined) updates.sizes = Array.isArray(sizes) ? sizes : [sizes];
    if (colors !== undefined) updates.colors = Array.isArray(colors) ? colors : [colors];
    if (description !== undefined) updates.description = description.trim();
    if (featured !== undefined) updates.featured = featured;
    if (newArrival !== undefined) updates.newArrival = newArrival;
    if (status !== undefined) updates.status = status;
    if (image !== undefined) updates.image = image;

    const db = getDb();
    if (db) {
      try {
        await db.update(schema.products).set(updates).where(eq(schema.products.id, id));
      } catch (err) {
        console.warn("DB product update error (falling back to memory):", err);
      }
    }

    // Update in-memory store
    const item = inMemoryStore.products.find((p) => p.id === id);
    if (item) {
      Object.assign(item, updates);
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully!",
      data: { product: item || updates },
    });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      message: "Product removed from catalogue successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
