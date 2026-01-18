// apps/dashboard/app/favicon.ico/route.ts
// Route handler to suppress favicon.ico 404 errors
// Returns 204 No Content to prevent console errors

import { NextResponse } from 'next/server';

export async function GET() {
  // Return 204 No Content - browser will stop requesting favicon
  return new NextResponse(null, { status: 204 });
}

