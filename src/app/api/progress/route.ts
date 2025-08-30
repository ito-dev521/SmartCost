import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    const { project_id, progress_rate, progress_date, notes } = await request.json()

    if (!project_id || progress_rate === undefined || !progress_date) {
      return NextResponse.json(
        { error: 'project_id, progress_rate, progress_date は必須です' },
        { status: 400 }
      )
    }

    const supabase = createClient()

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
    const { data, error } = await supabase
      .from('project_progress')
      .insert({
        project_id,
        progress_rate,
        progress_date,
        notes: notes || null,
        created_by: generateUUID(),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('project_progress insert error:', error)
      return NextResponse.json(
        { error: '進捗の記録に失敗しました' },
        { status: 500 }
      )
    }

    // 進捗率が100%の場合はプロジェクトを完了に更新
    if (Number(progress_rate) >= 100) {
      const { error: statusErr } = await supabase
        .from('projects')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', project_id)

      if (statusErr) {
        console.error('project status update error:', statusErr)
      }
    }

    return NextResponse.json({ success: true, message: '進捗を記録しました', data })
  } catch (error) {
    console.error('progress POST error:', error)
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

    let query = supabase
      .from('project_progress')
      .select(`*, projects ( id, name, business_number )`)
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
