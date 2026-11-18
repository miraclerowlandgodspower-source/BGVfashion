import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { checkAdminApiAccess } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Product } from "@/types";

export async function GET(req: Request) {
  const { authorized, errorResponse } = await checkAdminApiAccess();
  if (!authorized) return errorResponse!;

  const db = getDb();
  if (!db) {
    return NextResponse.json({ success: false, error: "Database unavailable. Products cannot be loaded safely." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const category = searchParams.get("category") || undefined;
    const department = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;

    let products = await db.select().from(schema.products);
    if (status) products = products.filter((p) => p.status === status);
    if (category && category !== "All categories") products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    if (department) products = products.filter((p) => p.department.toLowerCase() === department.toLowerCase());
    if (search) products = products.filter((p) => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search) || p.department.toLowerCase().includes(search) || p.description.toLowerCase().includes(search) || (p.sku || "").toLowerCase().includes(search));

    return NextResponse.json({ success: true, data: { products } });
  } catch (error) {
    console.error("Failed to fetch admin product catalogue from database:", error);
    return NextResponse.json({ success: false, error: "Database read failed. No fallback catalogue was returned." }, { status: 503 });
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
    if (!db) {
      return NextResponse.json({ success: false, error: "Database unavailable. Product was not saved." }, { status: 503 });
    }

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
    revalidatePath("/");
    revalidatePath("/shop");

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
    if (!db) {
      return NextResponse.json({ success: false, error: "Database unavailable. Product changes were not saved." }, { status: 503 });
    }

    const updated = await db.update(schema.products).set(updates).where(eq(schema.products.id, id)).returning();
    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/product/${id}`);

    return NextResponse.json({
      success: true,
      message: "Product updated and saved to database.",
      data: { product: updated[0] },
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
    if (!db) {
      return NextResponse.json({ success: false, error: "Database unavailable. Product was not deleted." }, { status: 503 });
    }

    const deleted = await db.delete(schema.products).where(eq(schema.products.id, id)).returning({ id: schema.products.id });
    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/shop");

    return NextResponse.json({
      success: true,
      message: "Product deleted from database and catalogue.",
    });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
