import { NextResponse } from "next/server";
import { seedDatabase, getProducts } from "@/lib/db";

export async function GET() {
  try {
    await seedDatabase();
    const products = await getProducts();
    return NextResponse.json({
      success: true,
      message: "Database seeded with BGV product catalogue.",
      count: products.length,
      products,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
