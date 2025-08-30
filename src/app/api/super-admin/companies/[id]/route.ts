import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { Company } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()

    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    const { id } = await params

    // 法人詳細を取得
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        departments(count),
        users(count),
        clients(count),
        projects(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '法人が見つかりません' }, { status: 404 })
      }
      console.error('法人取得エラー:', error)
      return NextResponse.json({ error: '法人の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('法人取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()

    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    const { id } = await params
    const body = await request.json()
    const { name, contact_name, email, address, phone } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '法人名は必須です' }, { status: 400 })
    }

    // 法人を更新
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        name: name.trim(),
        contact_name: contact_name ?? null,
        email: email ?? null,
        address: address ?? null,
        phone: phone ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '法人が見つかりません' }, { status: 404 })
      }
      console.error('法人更新エラー:', error)
      return NextResponse.json({ error: '法人の更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('法人更新エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()

    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    const { id } = await params

    // 法人を削除（カスケード削除で関連データも削除）
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('法人削除エラー:', error)
      return NextResponse.json({ error: '法人の削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: '法人が削除されました' })
  } catch (error) {
    console.error('法人削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}


