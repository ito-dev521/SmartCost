import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // リフレッシュセッション
  const { data: { session } } = await supabase.auth.getSession()

  // 保護されたルートのパターン
  const protectedRoutes = [
    '/dashboard',
    '/projects',
    '/clients',
    '/cost-entry',
    '/cash-flow',
    '/progress',
    '/analytics',
    '/admin',
    '/super-admin',
    '/users'
  ]

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // APIルートは認証チェックをスキップ（個別のAPIで処理）
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // 公開ルート
  const publicRoutes = ['/', '/login', '/auth']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isApiRoute) {
    if (!session) {
      // 認証されていない場合はログインページにリダイレクト
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isPublicRoute && session && request.nextUrl.pathname === '/login') {
    // ログイン済みでログインページにアクセスした場合はプロジェクトページにリダイレクト
    return NextResponse.redirect(new URL('/projects', request.url))
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
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
