import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  // Using refresh_token as it's an HttpOnly cookie
  const refreshToken = request.cookies.get('refresh_token')?.value
  const pathname = request.nextUrl.pathname

  const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/account') || pathname === '/checkout'
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register')

  // Protect account/admin routes
  if (isProtectedPath && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Prevent logged-in users from accessing login/register
  if (isAuthPath && refreshToken) {
    return NextResponse.redirect(new URL('/account', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout', '/login', '/register'],
}
