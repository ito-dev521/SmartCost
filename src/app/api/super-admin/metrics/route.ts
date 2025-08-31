import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()

    // 法人数
    const { count: companyCount, error: companiesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    // 監査ログ（24h）: 存在しない場合は0にフォールバック
    let auditCount = 0
    try {
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
      auditCount = count || 0
    } catch {
      auditCount = 0
    }

    // CADDON有効フラグ（admin_settings テーブルがある前提。無ければtrue）
    let caddonEnabled = true
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('caddon_enabled')
        .limit(1)
        .single()
      if (data && typeof (data as any).caddon_enabled === 'boolean') {
        caddonEnabled = (data as any).caddon_enabled
      }
    } catch {
      caddonEnabled = true
    }

    // DBサイズ: Supabase REST では直接取れないため未対応→将来用にnull
    const dbSizeMb: number | null = null

    if (companiesError) {
      return NextResponse.json({ error: 'メトリクス取得エラー' }, { status: 500 })
    }

    return NextResponse.json({
      companyCount: companyCount || 0,
      auditCount,
      dbSizeMb,
      caddonLinked: caddonEnabled
    })
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}


