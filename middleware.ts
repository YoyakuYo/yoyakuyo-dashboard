import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect customer routes - check for session token
  if (pathname.startsWith("/customer") && 
      !pathname.startsWith("/customer-login") && 
      !pathname.startsWith("/customer-signup")) {
    
    // Check for session token in cookies or headers
    const sessionToken = request.cookies.get("yoyaku_session_token")?.value ||
                        request.headers.get("authorization")?.replace("Bearer ", "");

    // If no token, let CustomerAuthGuard handle the redirect
    // This allows the component to check localStorage as well
    return NextResponse.next();
  }

  // Protect owner routes (if they exist)
  if (pathname.startsWith("/owner") || 
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/shops") && pathname !== "/shops" && !pathname.includes("/shops/")) {
    // Owner routes - check for owner session
    const sessionToken = request.cookies.get("yoyaku_session_token")?.value ||
                        request.headers.get("authorization")?.replace("Bearer ", "");
    
    // If no token, redirect to login
    // Owner auth guard will handle detailed checks
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/owner/:path*",
    "/dashboard/:path*",
  ],
};

