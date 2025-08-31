import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ユーティリティ: 日付が属する会計年度を決算月に基づいて算出
function resolveFiscalYear(dateISO: string, settlementMonth: number): number {
  const d = new Date(dateISO)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  // 決算月の翌月が年度開始月
  const startMonth = settlementMonth + 1
  return month >= startMonth ? year : year - 1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!body?.confirm) {
      return NextResponse.json({ error: 'confirm=true が必要です' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() { const store = await cookies(); return store.getAll() },
          async setAll(cookiesToSet) {
            const store = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options))
          },
        },
      }
    )

    // 現行の決算情報（クッキー優先、無ければDB/デフォルト）
    const store = await cookies()
    const fiCookie = store.get('fiscal-info')?.value
    const baseFiscal = fiCookie ? JSON.parse(fiCookie) : {
      fiscal_year: new Date().getFullYear(),
      settlement_month: 3,
      current_period: 1,
      bank_balance: 0,
      company_id: 'default-company'
    }

    const currentFiscalYear = Number(baseFiscal.fiscal_year)
    const settlementMonth = Number(baseFiscal.settlement_month || 3)

    // 当年度の収益合計を集計（project_progress.revenue_recognition を採用）
    const { data: progress, error: progressError } = await supabase
      .from('project_progress')
      .select('project_id, progress_date, revenue_recognition')

    if (progressError) {
      return NextResponse.json({ error: '進捗データ取得エラー', details: progressError.message }, { status: 500 })
    }

    const revenueByProject: Record<string, number> = {}
    for (const row of (progress || [])) {
      const fy = resolveFiscalYear(row.progress_date, settlementMonth)
      if (fy !== currentFiscalYear) continue
      const amount = Number(row.revenue_recognition || 0)
      revenueByProject[row.project_id] = (revenueByProject[row.project_id] || 0) + amount
    }

    // 全プロジェクトの契約金額を取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, contract_amount')

    if (projectsError) {
      return NextResponse.json({ error: 'プロジェクト取得エラー', details: projectsError.message }, { status: 500 })
    }

    // 結果集計: carryover = max(contract_amount - yearly_revenue, 0)
    const rolloverResults = (projects || []).map(p => {
      const contract = Number(p.contract_amount || 0)
      const earned = Number(revenueByProject[p.id] || 0)
      const carryover = Math.max(contract - earned, 0)
      return {
        project_id: p.id,
        business_number: p.business_number,
        name: p.name,
        contract,
        earned,
        carryover,
      }
    })

    const totalCarryover = rolloverResults.reduce((s, r) => s + r.carryover, 0)

    // 銀行期首残高（簡易: 現在の fiscal-info の bank_balance を使用）
    const openingBalance = Number(baseFiscal.bank_balance || 0)

    // 年度別契約額の保存（project_fiscal_summary）
    // 当年度のサマリ確定＋翌年度の期首契約額をcarryoverで設定
    for (const r of rolloverResults) {
      // 当年度をUPSERT
      await supabase.from('project_fiscal_summary').upsert({
        project_id: r.project_id,
        fiscal_year: currentFiscalYear,
        opening_contract_amount: r.contract, // 初年度は契約額、既にあれば更新されない
        year_revenue_recognized: r.earned,
        closing_carryover_amount: r.carryover,
      }, { onConflict: 'project_id,fiscal_year' })

      // 翌年度をUPSERT（openingにcarryover）
      await supabase.from('project_fiscal_summary').upsert({
        project_id: r.project_id,
        fiscal_year: currentFiscalYear + 1,
        opening_contract_amount: r.carryover,
      }, { onConflict: 'project_id,fiscal_year' })
    }

    // 銀行残高履歴に新年度期首レコード（opening_balance）を追加
    await supabase.from('bank_balance_history').insert({
      fiscal_year: currentFiscalYear + 1,
      balance_date: new Date(new Date().getFullYear(), (settlementMonth % 12), 1).toISOString().slice(0,10),
      opening_balance: openingBalance,
      closing_balance: openingBalance,
      total_income: 0,
      total_expense: 0,
    })

    // クッキー fiscal-info を次年度へ更新（現状は簡易にクッキー更新のみ）
    const nextFiscal = {
      ...baseFiscal,
      fiscal_year: currentFiscalYear + 1,
      current_period: 1,
      bank_balance: openingBalance,
    }
    store.set('fiscal-info', JSON.stringify(nextFiscal), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    })

    return NextResponse.json({
      fromFiscalYear: currentFiscalYear,
      toFiscalYear: currentFiscalYear + 1,
      projectsUpdated: rolloverResults.length,
      totalCarryover,
      openingBankBalance: openingBalance,
      details: rolloverResults,
    })
  } catch (error) {
    console.error('rollover error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}


