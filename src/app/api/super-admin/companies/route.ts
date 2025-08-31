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

    // プロジェクト件数は company_id が null のデータがあるため、client 経由でも補完
    const [deptMap, userMap, clientMap] = await Promise.all([
      fetchCounts('departments'),
      fetchCounts('users'),
      fetchCounts('clients'),
    ])

    // projects は company_id または clients.company_id を用いて集計
    const { data: projRows } = await supabase
      .from('projects')
      .select('company_id, client_id')

    const clientIds = Array.from(new Set((projRows || []).map(r => r.client_id).filter(Boolean))) as string[]
    let clientCompanyMap: Record<string, string> = {}
    if (clientIds.length > 0) {
      const { data: clientRows } = await supabase
        .from('clients')
        .select('id, company_id')
        .in('id', clientIds)
      clientCompanyMap = Object.fromEntries((clientRows || []).map(cr => [cr.id, cr.company_id]))
    }

    const projMap: Record<string, number> = {}
    ;(projRows || []).forEach(r => {
      const cid = r.company_id || clientCompanyMap[r.client_id as string]
      if (cid) projMap[cid] = (projMap[cid] || 0) + 1
    })

    // 会社設定（CADDON）
    const { data: cs, error: csError } = await supabase.from('company_settings').select('company_id, caddon_enabled')
    if (csError) {
      console.error('company_settings 取得エラー:', csError)
    }
    const csMap = Object.fromEntries((cs || []).map(r => [r.company_id, r.caddon_enabled]))

    const enriched = (companies || []).map(c => ({
      ...c,
      _counts: {
        departments: deptMap[c.id] || 0,
        users: userMap[c.id] || 0,
        clients: clientMap[c.id] || 0,
        projects: projMap[c.id] || 0,
      },
      _settings: { caddon_enabled: csMap[c.id] !== undefined ? csMap[c.id] : false }
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
    const { name, contact_name, email, address, phone, caddon_enabled } = body

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

    // 会社設定（CADDON有効/無効）: 新規はtrueで作成
    if (company?.id) {
      const { error: csUpsertError } = await supabase
        .from('company_settings')
        .upsert({ company_id: company.id, caddon_enabled: typeof caddon_enabled === 'boolean' ? caddon_enabled : true }, { onConflict: 'company_id' })
      if (csUpsertError) {
        console.error('会社設定の作成/更新エラー:', csUpsertError)
        return NextResponse.json({ error: '会社設定の保存に失敗しました。DBマイグレーション（company_settings）を適用してください。' }, { status: 500 })
      }
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('法人作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
















