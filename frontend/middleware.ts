import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAccountRoute = request.nextUrl.pathname.startsWith('/account')
  const isCheckout = request.nextUrl.pathname === '/checkout'

  if ((isAdminRoute || isAccountRoute || isCheckout) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Only admins can access /admin routes
  // (role check should be done server-side in layout.tsx too)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout'],
}
