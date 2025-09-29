import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> }
) {
  try {
    const supabase = createClient()
    const { memoId } = await params
    const body = await request.json()

    const { content } = body

    // バリデーション
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'メモ内容は必須です' }, { status: 400 })
    }

    // メモを更新
    const { data, error } = await supabase
      .from('project_memos')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', memoId)
      .select()
      .single()

    if (error) {
      console.error('❌ /api/projects/[id]/memos/[memoId] PUT: メモ更新エラー:', error)
      return NextResponse.json({ error: 'メモの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ memo: data })
  } catch (error) {
    console.error('プロジェクトメモ更新エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> }
) {
  try {
    const supabase = createClient()
    const { memoId } = await params

    // メモを削除
    const { error } = await supabase
      .from('project_memos')
      .delete()
      .eq('id', memoId)

    if (error) {
      console.error('❌ /api/projects/[id]/memos/[memoId] DELETE: メモ削除エラー:', error)
      return NextResponse.json({ error: 'メモの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: 'メモが削除されました' })
  } catch (error) {
    console.error('プロジェクトメモ削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}