import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: 銀行残高履歴を取得
export async function GET(request: NextRequest) {
  try {
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet: any[]) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // ユーザーの会社IDを取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ /api/bank-balance-history GET: 認証が必要')
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
      console.error('❌ /api/bank-balance-history GET: ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }


    // company_idがnullの場合は空の配列を返す
    if (!userData.company_id) {
      return NextResponse.json({
        history: [],
        total: 0,
        message: '新規法人のため、銀行残高履歴がありません。新しいデータを作成してください。'
      })
    }

    const { data: history, error } = await supabase
      .from('bank_balance_history')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('balance_date', { ascending: false })

    if (error) {
      console.error('❌ /api/bank-balance-history GET: 履歴取得エラー:', error)
    } else {
    }

    if (error) {
      console.error('銀行残高履歴取得エラー:', error)
      return NextResponse.json(
        { error: 'データの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history: history || [],
      total: history?.length || 0
    })

  } catch (error) {
    console.error('銀行残高履歴APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい銀行残高履歴を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 総支出を自動計算
    const openingBalance = body.opening_balance || 0
    const totalIncome = body.total_income || 0
    const closingBalance = body.closing_balance || 0
    const totalExpense = openingBalance + totalIncome - closingBalance
    

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet: any[]) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // ユーザーの会社IDを取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ /api/bank-balance-history POST: 認証が必要')
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
      console.error('❌ /api/bank-balance-history POST: ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }


    // 重複チェック（年月のみ）
    const monthYear = body.balance_date.substring(0, 7) // 年月のみ（例：2025-08）
    
    // 年月の範囲を正しく計算
    const year = parseInt(body.balance_date.substring(0, 4))
    const month = parseInt(body.balance_date.substring(5, 7))
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    
    const startDate = `${body.balance_date.substring(0, 7)}-01`
    const endDate = `${nextYear.toString().padStart(4, '0')}-${nextMonth.toString().padStart(2, '0')}-01`
    
    const { data: existingData, error: checkError } = await supabase
      .from('bank_balance_history')
      .select('id')
      .eq('company_id', userData.company_id)
      .gte('balance_date', startDate)
      .lt('balance_date', endDate)

    if (checkError) {
      console.error('重複チェックエラー:', checkError)
      console.error('重複チェック詳細:', {
        monthYear,
        balanceDate: body.balance_date,
        fiscalYear: body.fiscal_year,
        startDate,
        endDate
      })
      return NextResponse.json({ 
        error: '重複チェックに失敗しました',
        details: checkError.message 
      }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ 
        error: '同じ年月のデータは既に存在します。編集機能を使用して既存のデータを更新してください。',
        monthYear,
        existingCount: existingData.length,
        suggestion: '既存のデータを編集するか、別の年月を選択してください。'
      }, { status: 400 })
    }

    const insertData = {
      ...body,
      company_id: userData.company_id,
      total_expense: totalExpense
    }
    

    const { data, error } = await supabase
      .from('bank_balance_history')
      .insert([insertData])
      .select('*')

    if (error) {
      console.error('❌ /api/bank-balance-history POST: bank_balance_history 作成エラー:', error)
      console.error('❌ /api/bank-balance-history POST: エラー詳細:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // 重複キー制約違反の場合は特別なメッセージを返す
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: '同じ年月のデータは既に存在します。編集機能を使用して既存のデータを更新してください。',
          details: 'データベース制約により、同じ年度・年月の組み合わせで複数のデータを作成できません。',
          code: error.code,
          suggestion: '既存のデータを編集するか、別の年月を選択してください。'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: '作成に失敗しました',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ message: '銀行残高履歴を作成しました', history: data?.[0] })
  } catch (error) {
    console.error('銀行残高履歴作成APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// PUT: 銀行残高履歴を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // 総支出を自動計算
    const openingBalance = body.opening_balance || 0
    const totalIncome = body.total_income || 0
    const closingBalance = body.closing_balance || 0
    const totalExpense = openingBalance + totalIncome - closingBalance

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet: any[]) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 重複チェック（年月のみ、自分以外）
    const monthYear = body.balance_date.substring(0, 7) // 年月のみ（例：2025-08）
    
    // 年月の範囲を正しく計算
    const year = parseInt(body.balance_date.substring(0, 4))
    const month = parseInt(body.balance_date.substring(5, 7))
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    
    const startDate = `${body.balance_date.substring(0, 7)}-01`
    const endDate = `${nextYear.toString().padStart(4, '0')}-${nextMonth.toString().padStart(2, '0')}-01`
    
    const { data: existingData, error: checkError } = await supabase
      .from('bank_balance_history')
      .select('id')
      .gte('balance_date', startDate)
      .lt('balance_date', endDate)
      .neq('id', body.id)

    if (checkError) {
      console.error('重複チェックエラー:', checkError)
      console.error('重複チェック詳細:', {
        monthYear,
        balanceDate: body.balance_date,
        fiscalYear: body.fiscal_year,
        recordId: body.id,
        startDate,
        endDate
      })
      return NextResponse.json({ 
        error: '重複チェックに失敗しました',
        details: checkError.message 
      }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ 
        error: '同じ年月のデータは既に存在します',
        monthYear,
        existingCount: existingData.length
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bank_balance_history')
      .update({
        ...body,
        total_expense: totalExpense,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select('*')

    if (error) {
      console.error('bank_balance_history 更新エラー:', error)
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: '銀行残高履歴を更新しました', history: data?.[0] })
  } catch (error) {
    console.error('銀行残高履歴更新APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// DELETE: 銀行残高履歴を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet: any[]) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase
      .from('bank_balance_history')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('bank_balance_history 削除エラー:', error)
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: '銀行残高履歴を削除しました' })
  } catch (error) {
    console.error('銀行残高履歴削除APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
