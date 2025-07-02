
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 需要登录才能访问的页面
  const protectedRoutes = ['/dashboard', '/vault', '/checkin']
  
  // 只有未登录才能访问的页面
  const authOnlyRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

  // 检查是否为受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // 检查是否为认证专用路由
  const isAuthOnlyRoute = authOnlyRoutes.some(route => 
    pathname.startsWith(route)
  )

  // 未登录用户访问受保护页面，重定向到首页
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 已登录用户访问认证页面，重定向到dashboard
  if (isAuthOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 已登录用户访问首页，重定向到dashboard
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}