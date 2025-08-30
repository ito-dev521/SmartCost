import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { Company, SuperAdmin } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    // 全法人の一覧を取得
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        departments:departments(count),
        users:users(count),
        clients:clients(count),
        projects:projects(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('法人取得エラー:', error)
      return NextResponse.json({ error: '法人の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('法人取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    const body = await request.json()
    const { name, contact_name, email, address, phone } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '法人名は必須です' }, { status: 400 })
    }
    if (email && typeof email !== 'string') {
      return NextResponse.json({ error: 'メールアドレスの形式が不正です' }, { status: 400 })
    }

    // 法人を作成
    const { data: company, error } = await supabase
      .from('companies')
      .insert([{ 
        name: name.trim(),
        contact_name: contact_name || null,
        email: email || null,
        address: address || null,
        phone: phone || null
      }])
      .select()
      .single()

    if (error) {
      console.error('法人作成エラー:', error)
      return NextResponse.json({ error: '法人の作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('法人作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
















