import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("q") || undefined;
    const sort = searchParams.get("sort") || undefined;

    const products = await getProducts({
      department,
      category,
      search,
      sort,
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
