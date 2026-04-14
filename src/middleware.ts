import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/api/health', '/api/doctors', '/api/specialties', '/api/auth/signup', '/api/auth/login'];

const ADMIN_ROUTES = ['/api/admin', '/api/admin'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // All other routes require authentication
  // Session check via Supabase cookies happens in Route Handlers
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
