import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== API /api/progress POST 開始 ===')
    const requestBody = await request.json()
    console.log('リクエストボディ:', requestBody)

    const { project_id, progress_rate, progress_date, notes } = requestBody

    console.log('パラメータ確認:', {
      project_id,
      progress_rate,
      progress_date,
      notes,
      progress_rate_type: typeof progress_rate
    })

    if (!project_id || progress_rate === undefined || !progress_date) {
      console.log('バリデーションエラー: 必須フィールドが不足')
      return NextResponse.json(
        { error: 'project_id, progress_rate, progress_date は必須です' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    console.log('Supabaseクライアント作成完了')

    // 進捗率範囲チェック
    if (progress_rate < 0 || progress_rate > 100) {
      return NextResponse.json(
        { error: '進捗率は0-100の範囲で入力してください' },
        { status: 400 }
      )
    }

    // 認証未接続環境向けの簡易UUID
    const generateUUID = () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })

    // 進捗データを登録
    const insertData = {
      project_id,
      progress_rate,
      progress_date,
      notes: notes || null,
      created_by: generateUUID(),
      created_at: new Date().toISOString(),
    }

    console.log('INSERTデータ:', insertData)

    const { data, error } = await supabase
      .from('project_progress')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('project_progress insert error:', error)
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: '進捗の記録に失敗しました' },
        { status: 500 }
      )
    }

    console.log('INSERT成功:', data)

    // 進捗率が100%の場合はプロジェクトを完了に更新
    if (Number(progress_rate) >= 100) {
      console.log('進捗率100%: プロジェクトステータスを完了に更新')
      const { error: statusErr } = await supabase
        .from('projects')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', project_id)

      if (statusErr) {
        console.error('project status update error:', statusErr)
      } else {
        console.log('プロジェクトステータス更新成功')
      }
    }

    const responseData = { success: true, message: '進捗を記録しました', data }
    console.log('レスポンスデータ:', responseData)
    console.log('=== API /api/progress POST 完了 ===')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('=== API /api/progress POST エラー ===')
    console.error('エラー詳細:', error)
    console.error('エラーメッセージ:', error instanceof Error ? error.message : '不明なエラー')
    console.error('エラースタック:', error instanceof Error ? error.stack : 'スタックなし')
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
// GET: 進捗データ取得（任意のproject_idでフィルタ可能）
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    let companyId = searchParams.get('companyId')
    if (!companyId) {
      const cookieHeader = request.headers.get('cookie') || ''
      const m = cookieHeader.match(/(?:^|; )scope_company_id=([^;]+)/)
      if (m) companyId = decodeURIComponent(m[1])
    }

    // 会社指定がある場合は、その会社に属するproject_idに限定
    if (companyId && !project_id) {
      const { data: projRows } = await supabase
        .from('projects')
        .select('id, company_id, client_id')
      const clientIds = Array.from(new Set((projRows || []).map(r => r.client_id).filter(Boolean))) as string[]
      let clientCompanyMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data: clientRows } = await supabase
          .from('clients')
          .select('id, company_id')
          .in('id', clientIds)
        clientCompanyMap = Object.fromEntries((clientRows || []).map(cr => [cr.id, cr.company_id]))
      }
      const projectIds = (projRows || [])
        .filter(p => p.company_id === companyId || (p.client_id && clientCompanyMap[p.client_id as string] === companyId))
        .map(p => p.id)

      const { data, error } = await supabase
        .from('project_progress')
        .select(`*`)
        .in('project_id', projectIds)
        .order('progress_date', { ascending: false })

      if (error) {
        return NextResponse.json({ error: '進捗データの取得に失敗しました' }, { status: 500 })
      }
      return NextResponse.json({ data })
    }

    // 単一プロジェクトの指定、または会社指定なしの通常取得
    let query = supabase
      .from('project_progress')
      .select(`*`)
      .order('progress_date', { ascending: false })

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: '進捗データの取得に失敗しました' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
