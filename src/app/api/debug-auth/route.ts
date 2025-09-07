import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/debug-auth: 認証デバッグ開始')
    
    // 認証チェック
    const cookieStore = await cookies()
    console.log('🍪 クッキー一覧:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 ユーザー情報:', user ? { id: user.id, email: user.email } : null)
    console.log('❌ ユーザーエラー:', userError)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 セッション情報:', session ? { 
      access_token: session.access_token ? 'exists' : 'missing',
      refresh_token: session.refresh_token ? 'exists' : 'missing',
      expires_at: session.expires_at
    } : null)
    console.log('❌ セッションエラー:', sessionError)

    return NextResponse.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? { 
        access_token: session.access_token ? 'exists' : 'missing',
        refresh_token: session.refresh_token ? 'exists' : 'missing',
        expires_at: session.expires_at
      } : null,
      cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
      errors: {
        user: userError,
        session: sessionError
      }
    })

  } catch (error) {
    console.error('❌ /api/debug-auth: エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
