import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      changeDate,
      fromFiscalYear,
      fromSettlementMonth,
      toFiscalYear,
      toSettlementMonth,
      reason
    } = body

    // バリデーション
    if (!changeDate || !fromFiscalYear || !fromSettlementMonth || !toFiscalYear || !toSettlementMonth) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const store = await cookies()
            return store.getAll()
          },
          async setAll(cookiesToSet) {
            const store = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
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

    // 影響範囲を分析
    const { data: impactAnalysis, error: analysisError } = await supabase
      .rpc('analyze_fiscal_period_change_impact', {
        p_company_id: userData.company_id,
        p_from_fiscal_year: fromFiscalYear,
        p_from_settlement_month: fromSettlementMonth,
        p_to_fiscal_year: toFiscalYear,
        p_to_settlement_month: toSettlementMonth
      })

    if (analysisError) {
      console.error('影響分析エラー:', analysisError)
      return NextResponse.json(
        { error: '影響分析に失敗しました' },
        { status: 500 }
      )
    }

    // 決算期変更を実行
    const { data: changeResult, error: changeError } = await supabase
      .rpc('handle_fiscal_period_change', {
        p_company_id: userData.company_id,
        p_change_date: changeDate,
        p_from_fiscal_year: fromFiscalYear,
        p_from_settlement_month: fromSettlementMonth,
        p_to_fiscal_year: toFiscalYear,
        p_to_settlement_month: toSettlementMonth,
        p_reason: reason || null,
        p_created_by: user.id
      })

    if (changeError) {
      console.error('決算期変更エラー:', changeError)
      return NextResponse.json(
        { error: '決算期変更に失敗しました', details: changeError.message },
        { status: 500 }
      )
    }

    // クッキーを新しい決算期に更新
    const cookieStore = await cookies()
    const newFiscalInfo = {
      id: 'updated',
      company_id: userData.company_id,
      fiscal_year: toFiscalYear,
      settlement_month: toSettlementMonth,
      current_period: 1,
      bank_balance: changeResult?.new_fiscal_info?.bank_balance || 0,
      notes: `決算期変更: ${fromFiscalYear}年${fromSettlementMonth}月 → ${toFiscalYear}年${toSettlementMonth}月`
    }
    
    cookieStore.set('fiscal-info', JSON.stringify(newFiscalInfo), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30日
    })

    return NextResponse.json({
      success: true,
      message: '決算期変更が完了しました',
      impactAnalysis,
      changeResult,
      newFiscalInfo
    })

  } catch (error) {
    console.error('決算期変更APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 影響分析のみを取得するGETエンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromFiscalYear = parseInt(searchParams.get('from_fiscal_year') || '0')
    const fromSettlementMonth = parseInt(searchParams.get('from_settlement_month') || '0')
    const toFiscalYear = parseInt(searchParams.get('to_fiscal_year') || '0')
    const toSettlementMonth = parseInt(searchParams.get('to_settlement_month') || '0')

    if (!fromFiscalYear || !fromSettlementMonth || !toFiscalYear || !toSettlementMonth) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const store = await cookies()
            return store.getAll()
          },
          async setAll(cookiesToSet) {
            const store = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
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

    // 影響範囲を分析
    const { data: impactAnalysis, error: analysisError } = await supabase
      .rpc('analyze_fiscal_period_change_impact', {
        p_company_id: userData.company_id,
        p_from_fiscal_year: fromFiscalYear,
        p_from_settlement_month: fromSettlementMonth,
        p_to_fiscal_year: toFiscalYear,
        p_to_settlement_month: toSettlementMonth
      })

    if (analysisError) {
      console.error('影響分析エラー:', analysisError)
      return NextResponse.json(
        { error: '影響分析に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      impactAnalysis
    })

  } catch (error) {
    console.error('影響分析APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
