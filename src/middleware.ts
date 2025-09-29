import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  // URLのcompanyIdを検出してクッキーに保存（会社スコープの永続化）
  try {
    const url = new URL(request.url)
    const companyId = url.searchParams.get('companyId')
    if (companyId) {
      const res = NextResponse.next({ request: { headers: request.headers } })
      res.cookies.set('scope_company_id', companyId, { path: '/', httpOnly: false, sameSite: 'lax' })
      return res
    }
  } catch (e) {
  }
  // 会社単位のCADDONガード: セッションからcompany_idを取得し company_settings を参照
  try {
    if (request.nextUrl.pathname.startsWith('/caddon')) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll() {}
          }
        }
      )
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (userId) {
        const { data: userRow } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userId)
          .single()
        const companyId = (userRow as any)?.company_id
        if (companyId) {
          const { data: cs } = await supabase
            .from('company_settings')
            .select('caddon_enabled')
            .eq('company_id', companyId)
            .single()
          if (cs && cs.caddon_enabled === false) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
      }
    }
  } catch (e) {
  }
  // 開発用: Supabase 未設定（placeholder）の場合は認証チェックをスキップ
  const isPlaceholderSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
  if (isPlaceholderSupabase) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

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

    // スーパー管理者のアクセス制御を削除 - スーパー管理者は全てのページにアクセス可能
    // 以前の制限: スーパー管理者が/super-admin以外の保護されたルートにアクセスした場合は強制ログアウト
    // 現在: スーパー管理者は全ての保護されたルートにアクセス可能
    
    // スーパー管理者のアクセス制御を完全に削除
    // スーパー管理者は全ての保護されたルートにアクセス可能
  }

  if (isPublicRoute && session && request.nextUrl.pathname === '/login') {
    // ログイン済みでログインページにアクセスした場合、ロールに応じて行き先を分岐
    let redirectPath = '/projects'
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if ((userRow as any)?.role === 'superadmin') {
        redirectPath = '/super-admin'
      }
    } catch {}
    return NextResponse.redirect(new URL(redirectPath, request.url))
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
