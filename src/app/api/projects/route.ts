import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
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
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // プロジェクト一覧を取得（会社IDでフィルタリング、一般管理費プロジェクトとCADDONシステムは除外）
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', userData.company_id)  // 会社IDでフィルタリング
      .neq('business_number', 'IP')
      .not('name', 'ilike', '%一般管理費%')
      .not('business_number', 'ilike', 'C%')
      .not('name', 'ilike', '%CADDON%')
      .order('business_number', { ascending: true })

    if (error) {
      console.error('❌ /api/projects: プロジェクト取得エラー:', error)
      return NextResponse.json({ error: 'プロジェクトの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
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
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }


    // リクエストボディを取得
    const body = await request.json()

    const {
      name,
      business_number,
      client_id,
      client_name,
      contract_amount,
      start_date,
      end_date,
      status
    } = body

    // descriptionはprojectsテーブルに存在しない可能性があるため除外
    const description = body.description

    // バリデーション
                if (!name || !business_number || !client_id || !start_date || !end_date) {
              return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 })
            }

            // 業務番号の重複チェック
            const { data: existingProject, error: checkError } = await supabase
              .from('projects')
              .select('id, name')
              .eq('business_number', business_number.trim())
              .single()

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116は「データが見つからない」エラー
              console.error('❌ /api/projects: 重複チェックエラー:', checkError)
              return NextResponse.json({ error: '業務番号の重複チェックに失敗しました' }, { status: 500 })
            }

            if (existingProject) {
              return NextResponse.json({ 
                error: `業務番号「${business_number}」は既に使用されています（プロジェクト: ${existingProject.name}）` 
              }, { status: 400 })
            }

    // プロジェクトデータを準備（descriptionフィールドは除外）
    const projectData = {
      name: name.trim(),
      business_number: business_number.trim(),
      client_id,
      client_name,
      contract_amount: contract_amount || 0,
      start_date,
      end_date,
      status: status || 'planning',
      company_id: userData.company_id,  // 会社IDを追加
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // プロジェクトを作成

    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()


    if (error) {
      console.error('❌ /api/projects: プロジェクト作成エラー:', error)
      console.error('❌ /api/projects: エラー詳細:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({
        error: `プロジェクトの作成に失敗しました: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ project: data }, { status: 201 })
  } catch (error) {
    console.error('プロジェクト作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
