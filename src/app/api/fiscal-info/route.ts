import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { FiscalInfo, FiscalInfoInsert, FiscalInfoUpdate } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // クッキーベースの認証を使用
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // APIルートでは設定しない
          },
        },
      }
    )

    // 認証チェック
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('GET: 認証エラー: セッションなし')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 現在のユーザーの会社を取得
    let { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('company_id, name, role')
      .eq('id', session.user.id)
      .single()

    console.log('GET: ユーザー取得結果:', {
      currentUser,
      userError: userError?.message,
      userId: session.user.id,
      userEmail: session.user.email
    })

    if (userError || !currentUser) {
      console.log('GET: ユーザーが見つからない、自動作成を試行')

      // デフォルト会社を取得または作成
      let { data: defaultCompany, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()

      if (companyError) {
        console.log('GET: デフォルト会社が見つからないため作成')
        // デフォルト会社が存在しない場合は作成
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert([{
            name: 'デフォルト会社'
          }])
          .select()
          .single()

        if (createCompanyError) {
          console.error('GET: 会社作成エラー:', createCompanyError)
          return NextResponse.json({ error: '会社作成に失敗しました' }, { status: 500 })
        }

        defaultCompany = newCompany
        console.log('GET: デフォルト会社作成成功:', newCompany)
      }

      // ユーザーが存在しない場合は自動作成
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          role: 'admin',
          company_id: defaultCompany.id
        }])
        .select()
        .single()

      if (createError) {
        console.error('GET: ユーザー作成エラー:', createError)
        return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 })
      }

      console.log('GET: ユーザー作成成功:', newUser)
      currentUser = {
        company_id: newUser.company_id,
        name: newUser.name,
        role: newUser.role
      }
    }

    if (!currentUser?.company_id) {
      console.log('GET: 会社情報が見つからない')
      return NextResponse.json({ error: '会社情報が見つかりません。管理者に連絡してください。' }, { status: 404 })
    }

    // 決算情報を取得
    const { data: fiscalInfo, error } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('GET: 決算情報取得エラー:', error)
      return NextResponse.json({ error: '決算情報の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ fiscalInfo })
  } catch (error) {
    console.error('GET: 決算情報取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // クッキーベースの認証を使用
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // APIルートでは設定しない
          },
        },
      }
    )

    // 認証チェック
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('POST: 認証エラー: セッションなし')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    console.log('POST: 認証成功:', session.user.email)

    // 現在のユーザーの会社を取得
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('company_id, name, role')
      .eq('id', session.user.id)
      .single()

    console.log('POST: ユーザー取得結果:', {
      currentUser,
      userError: userError?.message,
      userId: session.user.id,
      userEmail: session.user.email
    })

    if (userError || !currentUser) {
      console.log('POST: ユーザーが見つからない、自動作成を試行')

      // デフォルト会社を取得または作成
      let { data: defaultCompany, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()

      if (companyError) {
        console.log('POST: デフォルト会社が見つからないため作成')
        // デフォルト会社が存在しない場合は作成
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert([{
            name: 'デフォルト会社'
          }])
          .select()
          .single()

        if (createCompanyError) {
          console.error('POST: 会社作成エラー:', createCompanyError)
          return NextResponse.json({ error: '会社作成に失敗しました' }, { status: 500 })
        }

        defaultCompany = newCompany
        console.log('POST: デフォルト会社作成成功:', newCompany)
      }

      // ユーザーが存在しない場合は自動作成
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          role: 'admin',
          company_id: defaultCompany.id
        }])
        .select()
        .single()

      if (createError) {
        console.error('POST: ユーザー作成エラー:', createError)
        return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 })
      }

      console.log('POST: ユーザー作成成功:', newUser)
      // 作成したユーザーの情報を設定
      const userData = {
        company_id: newUser.company_id,
        name: newUser.name,
        role: newUser.role
      }

      return NextResponse.json({
        fiscalInfo: null,
        message: 'ユーザーを登録しました。決算情報を設定してください。',
        userData
      }, { status: 201 })
    }

    if (!currentUser?.company_id) {
      console.log('POST: 会社情報が見つからない')
      return NextResponse.json({ error: '会社情報が見つかりません。管理者に連絡してください。' }, { status: 404 })
    }

    const body = await request.json()
    const { fiscal_year, settlement_month, current_period, bank_balance, notes }: FiscalInfoInsert = body

    // バリデーション
    if (!fiscal_year || !settlement_month) {
      return NextResponse.json({ error: '年度と決算月は必須です' }, { status: 400 })
    }

    if (settlement_month < 1 || settlement_month > 12) {
      return NextResponse.json({ error: '決算月は1-12の範囲で指定してください' }, { status: 400 })
    }

    // 既存の決算情報をチェック
    const { data: existingInfo } = await supabase
      .from('fiscal_info')
      .select('id')
      .eq('company_id', currentUser.company_id)
      .eq('fiscal_year', fiscal_year)
      .single()

    let result

    if (existingInfo) {
      // 更新
      const { data, error } = await supabase
        .from('fiscal_info')
        .update({
          settlement_month,
          current_period: current_period || 1,
          bank_balance: bank_balance || 0,
          notes
        })
        .eq('id', existingInfo.id)
        .select()
        .single()

      if (error) {
        console.error('POST: 決算情報更新エラー:', error)
        return NextResponse.json({ error: '決算情報の更新に失敗しました' }, { status: 500 })
      }

      result = data
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('fiscal_info')
        .insert([{
          company_id: currentUser.company_id,
          fiscal_year,
          settlement_month,
          current_period: current_period || 1,
          bank_balance: bank_balance || 0,
          notes
        }])
        .select()
        .single()

      if (error) {
        console.error('POST: 決算情報作成エラー:', error)
        return NextResponse.json({ error: '決算情報の作成に失敗しました' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ fiscalInfo: result }, { status: existingInfo ? 200 : 201 })
  } catch (error) {
    console.error('POST: 決算情報保存エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // POSTと同じ処理
  return POST(request)
}
