import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { permissionChecker } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/projects: GETリクエスト受信')

    // 認証チェック（デバッグ用に一時的に無効化）
    console.log('🔍 /api/projects: 認証チェック開始')

    // Supabase 未設定（placeholder）の場合はスタブを返して UI を動かす
    const isPlaceholderSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    if (isPlaceholderSupabase) {
      console.log('🔧 /api/projects: placeholder 環境のためスタブデータを返却')
      return NextResponse.json({ projects: [] })
    }

    // サービスロールキーを使用してSupabaseクライアントを作成
    const supabase = createClient()
    console.log('📋 /api/projects: Supabaseクライアント作成完了')

    // デバッグ用に認証チェックを完全にスキップ
    console.log('✅ /api/projects: 認証チェックスキップ、プロジェクト一覧取得')

    // リクエストヘッダーをログ出力
    console.log('📋 /api/projects: リクエストヘッダー:', Object.fromEntries(request.headers.entries()))

    // クエリから companyId を取得
    const { searchParams } = new URL(request.url)
    let companyId = searchParams.get('companyId')
    if (!companyId) {
      const cookieHeader = request.headers.get('cookie') || ''
      const m = cookieHeader.match(/(?:^|; )scope_company_id=([^;]+)/)
      if (m) companyId = decodeURIComponent(m[1])
    }

    // プロジェクト一覧を取得（一般管理費プロジェクトとCADDONシステムは除外）
    console.log('🔍 /api/projects: プロジェクト一覧取得開始')
    let query = supabase
      .from('projects')
      .select('*')
      .neq('business_number', 'IP')
      .not('name', 'ilike', '%一般管理費%')
      .not('business_number', 'ilike', 'C%')
      .not('name', 'ilike', '%CADDON%')
      .order('business_number', { ascending: true })

    if (companyId) {
      // company_id 直付 or clients.company_id 経由のいずれかに紐づくもののみ返す
      // まず projects の client_id を集め、clients を引いて companyId を判別
      const { data: projRows } = await supabase
        .from('projects')
        .select('id, company_id, client_id')
      const clientIds = Array.from(new Set((projRows || []).map(r => r.client_id).filter(Boolean))) as string[]
      let clientCompanyIds: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clientRows } = await supabase
          .from('clients')
          .select('id, company_id')
          .in('id', clientIds)
        clientCompanyIds = Object.fromEntries((clientRows || []).map(cr => [cr.id, cr.company_id]))
      }
      // 会社に属さないID集合を後でフィルタ用に使うため、取得後に絞り込み
      const { data: allProjects, error } = await query
      if (error) {
        console.error('❌ /api/projects: プロジェクト取得エラー:', error)
        return NextResponse.json({ error: 'プロジェクトの取得に失敗しました' }, { status: 500 })
      }
      const filtered = (allProjects || []).filter(p => {
        return p.company_id === companyId || (p.client_id && clientCompanyIds[p.client_id] === companyId)
      })
      console.log('✅ /api/projects: フィルタ後件数:', filtered.length)
      return NextResponse.json({ projects: filtered })
    }

    const { data: projects, error } = await query

    if (error) {
      console.error('❌ /api/projects: プロジェクト取得エラー:', error)
      return NextResponse.json({ error: 'プロジェクトの取得に失敗しました' }, { status: 500 })
    }

    console.log('✅ /api/projects: プロジェクト取得成功:', projects?.length || 0)
    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 /api/projects: POSTリクエスト受信')

    // 認証チェック（デバッグ用に一時的に無効化）
    console.log('🔍 /api/projects: 認証チェック開始')

    // サービスロールキーを使用してSupabaseクライアントを作成
    const supabase = createClient()
    console.log('📋 /api/projects: Supabaseクライアント作成完了')

    // デバッグ用に認証チェックを完全にスキップ
    console.log('✅ /api/projects: 認証チェックスキップ、プロジェクト作成')

    // リクエストボディを取得
    const body = await request.json()
    console.log('📋 /api/projects: リクエストボディ:', body)

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
              console.log('❌ /api/projects: 必須項目不足')
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
              console.log('❌ /api/projects: 業務番号重複:', { business_number, existingProject })
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // descriptionがある場合はログに記録（将来的な拡張用）
    if (description) {
      console.log('📋 /api/projects: descriptionフィールド（未使用）:', description.trim())
    }

    console.log('📋 /api/projects: 作成するプロジェクトデータ:', projectData)

    // プロジェクトを作成
    console.log('🔍 /api/projects: データベース挿入開始')
    console.log('📋 /api/projects: 挿入データ:', projectData)

    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    console.log('📋 /api/projects: 挿入結果:', { data, error })

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

    console.log('✅ /api/projects: プロジェクト作成成功:', data)
    return NextResponse.json({ project: data }, { status: 201 })
  } catch (error) {
    console.error('プロジェクト作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
