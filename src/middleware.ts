import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || "bgv_super_secret_jwt_key_fashion_2026_production_safe_token";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Protect /admin routes (except login)
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const token = request.cookies.get("bgv_auth_token")?.value;
    
    if (!token) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      if (payload.role !== "admin") {
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Visitor Tracking
  // We can track the user session anonymously
  let response = NextResponse.next();

  let sessionId = request.cookies.get("bgv_visitor_session")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set("bgv_visitor_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  // Note: actual DB insertion for visitor tracking is better done via a layout effect or Server Action,
  // since middleware running on Edge might not have easy access to postgres via pg (requires HTTP driver or Neon).
  // But we have the session ID securely set.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
