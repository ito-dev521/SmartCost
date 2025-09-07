import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/company-settings: GETリクエスト受信')
    const cookieStore = await cookies()
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

    // ユーザーの会社IDを取得
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 /api/company-settings: ユーザー情報:', user ? '認証済み' : '未認証')
    
    if (!user) {
      console.log('❌ /api/company-settings: 認証が必要')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ /api/company-settings: ユーザーデータ取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    console.log('📋 /api/company-settings: ユーザーの会社ID:', userData.company_id)

    // 会社設定を取得
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('caddon_enabled')
      .eq('company_id', userData.company_id)
      .single()

    console.log('📋 /api/company-settings: 会社設定取得結果:', { companySettings, settingsError })

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ /api/company-settings: 会社設定取得エラー:', settingsError)
      return NextResponse.json(
        { error: '会社設定の取得に失敗しました' },
        { status: 500 }
      )
    }

    // デフォルトは有効（設定がない場合）
    const caddonEnabled = companySettings?.caddon_enabled ?? true
    console.log('✅ /api/company-settings: CADDON状態:', caddonEnabled)

    return NextResponse.json({
      caddon_enabled: caddonEnabled
    })

  } catch (error) {
    console.error('❌ /api/company-settings: エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
