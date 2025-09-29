import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // プロジェクトメモを取得
    const { data: memos, error } = await supabase
      .from('project_memos')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ /api/projects/[id]/memos GET: メモ取得エラー:', error)
      return NextResponse.json({ error: 'メモの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ memos })
  } catch (error) {
    console.error('プロジェクトメモ取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    const body = await request.json()

    const { content, created_by_name, created_by_email } = body

    // バリデーション
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'メモ内容は必須です' }, { status: 400 })
    }

    if (!created_by_name || !created_by_name.trim()) {
      return NextResponse.json({ error: '作成者名は必須です' }, { status: 400 })
    }

    // メモを作成
    const { data, error } = await supabase
      .from('project_memos')
      .insert({
        project_id: id,
        content: content.trim(),
        created_by_name: created_by_name.trim(),
        created_by_email: created_by_email || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ /api/projects/[id]/memos POST: メモ作成エラー:', error)
      return NextResponse.json({ error: 'メモの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ memo: data })
  } catch (error) {
    console.error('プロジェクトメモ作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}