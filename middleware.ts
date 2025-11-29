import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect customer routes - redirect to login if not authenticated
  if (pathname.startsWith("/customer") && !pathname.startsWith("/customer-login") && !pathname.startsWith("/customer-signup")) {
    // This will be handled by CustomerAuthGuard component
    // Middleware just ensures the route exists
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
  ],
};

