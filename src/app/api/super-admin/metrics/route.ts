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

    // DBサイズ: Supabase REST では直接取れないため未対応→将来用にnull
    const dbSizeMb: number | null = null

    if (companiesError) {
      return NextResponse.json({ error: 'メトリクス取得エラー' }, { status: 500 })
    }

    return NextResponse.json({
      companyCount: companyCount || 0,
      auditCount,
      dbSizeMb,
      caddonLinked: true
    })
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}


