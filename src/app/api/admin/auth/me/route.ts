import { NextResponse } from "next/server";
import { checkAdminApiAccess } from "@/lib/auth";

export async function GET() {
  const { authorized, user, errorResponse } = await checkAdminApiAccess();
  if (!authorized) {
    return errorResponse!;
  }

  return NextResponse.json({
    success: true,
    data: { user },
  });
}
