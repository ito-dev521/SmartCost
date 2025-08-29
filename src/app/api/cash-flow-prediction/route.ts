import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Project {
  id: string
  name: string
  business_number: string | null
  contract_amount: number | null
  start_date: string | null
  end_date: string | null
  client_name: string | null
  status: string
}

interface Client {
  id: string
  name: string
  payment_cycle_type: string | null
  payment_cycle_closing_day: number | null
  payment_cycle_payment_month_offset: number | null
  payment_cycle_payment_day: number | null
}

interface CostEntry {
  id: string
  project_id: string | null
  entry_date: string
  amount: number
  entry_type: string
}

interface CaddonBilling {
  id: string
  billing_month: string
  amount: number
}

interface FiscalInfo {
  id: string
  fiscal_year: number
  settlement_month: number
  current_period: number
  bank_balance: number
  notes: string | null
}

interface MonthlyData {
  month: number
  year: number
  amount: number
}

export async function GET(request: NextRequest) {
  try {
    console.log('Cash flow prediction API called')

    const { searchParams } = new URL(request.url)
    const fiscalYear = parseInt(searchParams.get('fiscal_year') || new Date().getFullYear().toString())
    const months = parseInt(searchParams.get('months') || '12')

    console.log('Parameters:', { fiscalYear, months })

    // Supabaseクライアントを作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies().set(name, value, options)
            })
          },
        },
      }
    )
    console.log('Supabase client created')

    // プロジェクトデータを取得
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .order('name')

    // 原価エントリーデータを取得
    const { data: costEntries } = await supabase
      .from('cost_entries')
      .select('*')
      .order('entry_date', { ascending: false })

    // クライアントデータを取得
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    // CADDON請求データを取得
    const { data: caddonBillings } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')

    // クッキーから決算情報を取得
    const allCookies = cookies().getAll()
    const fiscalInfoCookie = allCookies.find(cookie => cookie.name === 'fiscal-info')

    let fiscalInfoData = null
    if (fiscalInfoCookie) {
      try {
        fiscalInfoData = [JSON.parse(fiscalInfoCookie.value)]
        console.log('クッキーから取得した決算情報:', fiscalInfoData[0])
      } catch (error) {
        console.error('クッキーパースエラー:', error)
      }
    }

    const fiscalInfo: FiscalInfo = fiscalInfoData && fiscalInfoData.length > 0
      ? fiscalInfoData[0]
      : {
          id: 'default',
          fiscal_year: new Date().getFullYear(),
          settlement_month: 3, // データベースに決算情報がない場合のデフォルト値
          current_period: 1,
          bank_balance: 5000000,
          notes: 'デフォルト設定'
        }

    console.log('使用する決算情報:', fiscalInfo)

    // 分析・レポートと同じ計算ロジック
    const monthlyRevenue = calculateMonthlyRevenue(
      projects || [],
      clients || [],
      caddonBillings || [],
      fiscalInfo
    )

    const monthlyCost = calculateMonthlyCost(
      costEntries || [],
      projects || []
    )

    // 予測データを生成（決算月の翌月1日から開始）
    const predictions = []
    const settlementMonth = fiscalInfo.settlement_month
    // 決算月の翌月を計算（例: 決算月3月 → 開始月4月）
    const nextMonth = settlementMonth === 12 ? 1 : settlementMonth + 1
    const nextYear = settlementMonth === 12 ? fiscalInfo.fiscal_year + 1 : fiscalInfo.fiscal_year
    let runningBalance = fiscalInfo.bank_balance

    console.log(`決算月: ${settlementMonth}月, 翌月: ${nextMonth}月 (${nextYear}年)`)
    console.log(`予測開始日付: ${nextYear}年${nextMonth}月1日`)

    for (let i = 0; i < months; i++) {
      // 決算月の翌月からiヶ月後の日付を計算
      let targetYear = nextYear
      let targetMonth = nextMonth + i

      // 月が12を超えたら年を進める
      if (targetMonth > 12) {
        targetYear += Math.floor((targetMonth - 1) / 12)
        targetMonth = ((targetMonth - 1) % 12) + 1
      }

      const targetDate = new Date(targetYear, targetMonth - 1, 1)
      const month = targetDate.getMonth() + 1
      const year = targetDate.getFullYear()

      // 日付文字列を明示的に生成（タイムゾーン問題を避ける）
      const dateString = `${year}-${String(month).padStart(2, '0')}-01`

      console.log(`i=${i}: 計算前: nextMonth=${nextMonth}, targetMonth=${nextMonth + i}`)
      console.log(`i=${i}: 計算後: targetMonth=${targetMonth}, targetYear=${targetYear}, dateString=${dateString}`)

      // デバッグ: 最初の数回の計算を確認
      if (i < 3) {
        console.log(`計算詳細: i=${i}, 元の月=${nextMonth + i}, 最終月=${targetMonth}, 年=${targetYear}`)
      }

      const revenueData = monthlyRevenue.find(r => r.month === month && r.year === year)
      const costData = monthlyCost.find(c => c.month === month && c.year === year)

      const predictedInflow = revenueData?.amount || 0
      const predictedOutflow = costData?.amount || 0
      runningBalance = runningBalance + predictedInflow - predictedOutflow

      predictions.push({
        date: dateString,
        predicted_inflow: Math.round(predictedInflow),
        predicted_outflow: Math.round(predictedOutflow),
        predicted_balance: Math.round(runningBalance),
        confidence_score: 0.85,
        risk_level: predictedOutflow > predictedInflow ? 'high' : predictedOutflow > predictedInflow * 0.8 ? 'medium' : 'low',
        factors: {
          seasonal_trend: 1.0,
          historical_pattern: 1.0,
          project_cycle: 0.8,
          market_conditions: 1.0
        },
        recommendations: runningBalance < 1000000
          ? ['資金不足のリスクがあります。支出を削減するか、収入源を増やすことを検討してください']
          : ['安定したキャッシュフローを維持しています']
      })
    }

    return NextResponse.json({
      fiscal_year: fiscalInfo.fiscal_year,
      settlement_month: fiscalInfo.settlement_month,
      note: `決算月: ${fiscalInfo.settlement_month}月、予測開始: ${fiscalInfo.settlement_month + 1}月`,
      predictions,
      summary: {
        total_predicted_inflow: Math.round(predictions.reduce((sum, p) => sum + p.predicted_inflow, 0)),
        total_predicted_outflow: Math.round(predictions.reduce((sum, p) => sum + p.predicted_outflow, 0)),
        net_cash_flow: Math.round(predictions.reduce((sum, p) => sum + (p.predicted_inflow - p.predicted_outflow), 0)),
        average_balance: Math.round(predictions.reduce((sum, p) => sum + p.predicted_balance, 0) / predictions.length),
        minimum_balance: Math.min(...predictions.map(p => p.predicted_balance)),
        maximum_balance: Math.max(...predictions.map(p => p.predicted_balance)),
        high_risk_months: predictions.filter(p => p.risk_level === 'high').length,
        average_confidence: Math.round(predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length * 100) / 100
      }
    })

  } catch (error) {
    console.error('キャッシュフロー予測エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 分析・レポートと同じ計算ロジック
function calculateMonthlyRevenue(
  projects: Project[],
  clients: Client[],
  caddonBillings: CaddonBilling[],
  fiscalInfo: FiscalInfo
): MonthlyData[] {
  const monthlyRevenue: MonthlyData[] = []

  // 一般管理費を除外したプロジェクトを取得
  const filteredProjects = projects.filter(project =>
    !project.name.includes('一般管理費') &&
    !project.name.includes('その他経費')
  )

  filteredProjects.forEach(project => {
    if (project.contract_amount && project.contract_amount > 0) {
      // プロジェクトの終了日を基に収入を計上
      if (project.end_date) {
        const endDate = new Date(project.end_date)
        const revenueMonth = endDate.getMonth() + 1
        const revenueYear = endDate.getFullYear()

        // 既存のデータを検索または新規作成
        let existingData = monthlyRevenue.find(
          r => r.month === revenueMonth && r.year === revenueYear
        )

        if (existingData) {
          existingData.amount += project.contract_amount
        } else {
          monthlyRevenue.push({
            month: revenueMonth,
            year: revenueYear,
            amount: project.contract_amount
          })
        }
      }
    }
  })

  // CADDON請求も収入として計上
  caddonBillings.forEach(billing => {
    const billingDate = new Date(billing.billing_month)
    const month = billingDate.getMonth() + 1
    const year = billingDate.getFullYear()

    let existingData = monthlyRevenue.find(
      r => r.month === month && r.year === year
    )

    if (existingData) {
      existingData.amount += billing.amount
    } else {
      monthlyRevenue.push({
        month,
        year,
        amount: billing.amount
      })
    }
  })

  return monthlyRevenue
}

function calculateMonthlyCost(
  costEntries: CostEntry[],
  projects: Project[]
): MonthlyData[] {
  const monthlyCost: MonthlyData[] = []

  costEntries.forEach(entry => {
    const entryDate = new Date(entry.entry_date)
    const month = entryDate.getMonth() + 1
    const year = entryDate.getFullYear()

    let existingData = monthlyCost.find(
      c => c.month === month && c.year === year
    )

    if (existingData) {
      existingData.amount += entry.amount
    } else {
      monthlyCost.push({
        month,
        year,
        amount: entry.amount
      })
    }
  })

  return monthlyCost
}