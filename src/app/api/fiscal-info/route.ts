import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('fiscal-info GET called')
    const url = new URL(request.url)
    const list = url.searchParams.get('list')
    const yearParam = url.searchParams.get('year')
    const clearView = url.searchParams.get('clearView')

    // Supabaseクライアントを作成
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
    if (!user) {
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
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    console.log('🔍 決算情報取得: 会社ID', userData.company_id)

    // データベースから決算情報を取得
    const { data: fiscalInfoData, error: fiscalError } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()

    let fiscalInfo
    if (fiscalError && fiscalError.code !== 'PGRST116') {
      console.error('❌ 決算情報取得エラー:', fiscalError)
      return NextResponse.json(
        { error: '決算情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!fiscalInfoData || fiscalError?.code === 'PGRST116') {
      console.log('📋 決算情報が存在しないため、デフォルト値を作成')
      // デフォルト値
      fiscalInfo = {
        id: 'default',
        company_id: userData.company_id,
        fiscal_year: new Date().getFullYear(),
        settlement_month: 3,
        current_period: 1,
        bank_balance: 5000000,
        notes: 'デフォルト設定'
      }
    } else {
      console.log('✅ 決算情報取得成功:', fiscalInfoData)
      fiscalInfo = fiscalInfoData
    }

    // 年度一覧が要求された場合
    if (list === 'years') {
      const { data } = await supabase
        .from('fiscal_info')
        .select('fiscal_year')
        .eq('company_id', userData.company_id)
        .order('fiscal_year', { ascending: false })

      const currentYear = fiscalInfo.fiscal_year
      const years = (data || []).map(d => d.fiscal_year).filter((y: number) => y < currentYear)
      return NextResponse.json({ years, current: currentYear })
    }

    // 年度切替の要求
    if (yearParam) {
      const y = Number(yearParam)
      // 指定された年度の決算情報を取得
      const { data: yearFiscalInfo, error: yearError } = await supabase
        .from('fiscal_info')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('fiscal_year', y)
        .single()

      if (yearError && yearError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: '指定年度の決算情報が見つかりません' },
          { status: 404 }
        )
      }

      const returned = yearFiscalInfo || { ...fiscalInfo, fiscal_year: y }
      return NextResponse.json({ fiscalInfo: returned, readonly: true })
    }

    // 閲覧年度のクリア
    if (clearView) {
      return NextResponse.json({ fiscalInfo, readonly: false })
    }

    console.log('Returning fiscal info:', fiscalInfo)
    return NextResponse.json({ fiscalInfo, readonly: false })
  } catch (error) {
    console.error('GET: 決算情報取得エラー:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('fiscal-info POST called')
    const body = await request.json()
    const { fiscal_year, settlement_month, current_period, bank_balance, notes } = body
    console.log('POST body:', body)

    // Supabaseクライアントを作成
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
    if (!user) {
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
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 決算情報をデータベースに保存
    const fiscalInfoData = {
      company_id: userData.company_id,
      fiscal_year: fiscal_year || new Date().getFullYear(),
      settlement_month: settlement_month || 3,
      current_period: current_period || 1,
      bank_balance: bank_balance || 5000000,
      notes: notes || '更新された設定'
    }

    console.log('💾 決算情報をデータベースに保存:', fiscalInfoData)

    // 既存の決算情報があるかチェック
    const { error: checkError } = await supabase
      .from('fiscal_info')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('fiscal_year', fiscalInfoData.fiscal_year)
      .single()

    let result
    if (checkError && checkError.code === 'PGRST116') {
      // 新規作成
      const { data, error } = await supabase
        .from('fiscal_info')
        .insert([fiscalInfoData])
        .select()
        .single()

      if (error) {
        console.error('❌ 決算情報作成エラー:', error)
        return NextResponse.json(
          { error: '決算情報の作成に失敗しました' },
          { status: 500 }
        )
      }
      result = data
      console.log('✅ 決算情報を新規作成:', result)
    } else if (checkError) {
      console.error('❌ 決算情報チェックエラー:', checkError)
      return NextResponse.json(
        { error: '決算情報の確認に失敗しました' },
        { status: 500 }
      )
    } else {
      // 更新
      const { data, error } = await supabase
        .from('fiscal_info')
        .update(fiscalInfoData)
        .eq('company_id', userData.company_id)
        .eq('fiscal_year', fiscalInfoData.fiscal_year)
        .select()
        .single()

      if (error) {
        console.error('❌ 決算情報更新エラー:', error)
        return NextResponse.json(
          { error: '決算情報の更新に失敗しました' },
          { status: 500 }
        )
      }
      result = data
      console.log('✅ 決算情報を更新:', result)
    }

    return NextResponse.json({
      fiscalInfo: result,
      message: '決算情報を保存しました'
    }, { status: 200 })
  } catch (error) {
    console.error('POST: 決算情報保存エラー:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // POSTと同じ処理
  return POST(request)
}
