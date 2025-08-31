import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { Company, SuperAdmin } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    // ダミーUIプレビューのため、認証・権限チェックは一時的にスキップ

    // 1) 法人の基本情報を取得
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (compError) {
      console.error('法人取得エラー:', compError)
      return NextResponse.json({ error: '法人の取得に失敗しました' }, { status: 500 })
    }

    const companyIds = (companies || []).map(c => c.id)

    // 2) 関連テーブルの件数をグルーピングで取得（FKリレーションが未設定でもOK）
    type CountRow = { company_id: string; count: number }
    const fetchCounts = async (table: string): Promise<Record<string, number>> => {
      const { data } = await supabase
        .from(table)
        .select('company_id, count:company_id', { count: 'exact' }) as unknown as { data: CountRow[] | null }
      const map: Record<string, number> = {}
      ;(data || []).forEach(r => { if (r.company_id) map[r.company_id] = (map[r.company_id] || 0) + 1 })
      return map
    }

    const [deptMap, userMap, clientMap, projMap] = await Promise.all([
      fetchCounts('departments'),
      fetchCounts('users'),
      fetchCounts('clients'),
      fetchCounts('projects'),
    ])

    const enriched = (companies || []).map(c => ({
      ...c,
      _counts: {
        departments: deptMap[c.id] || 0,
        users: userMap[c.id] || 0,
        clients: clientMap[c.id] || 0,
        projects: projMap[c.id] || 0,
      }
    }))

    return NextResponse.json({ companies: enriched })
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
















