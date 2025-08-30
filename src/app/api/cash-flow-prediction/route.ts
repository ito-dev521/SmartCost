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
  amount: number | null
  total_amount?: number | null
  project_id?: string | null
}

interface ProjectProgressRow {
  project_id: string
  progress_percent: number | null
  expected_end_date: string | null
}

type MonthKey = string // 'YYYY-MM'

interface SplitBilling {
  project_id: string
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

// 年間入金予定表の月毎の金額を計算する関数
// 支払サイクルを基に入金予定日を算出
function calculatePaymentDateServer(endDate: string, client: Client): Date {
  if (!endDate || !client?.payment_cycle_type) {
    return new Date(endDate || new Date())
  }

  const end = new Date(endDate)
  const paymentDate = new Date()

  if (client.payment_cycle_type === 'month_end') {
    const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
    const targetYear = end.getFullYear()
    const targetMonth = end.getMonth() + paymentMonthOffset
    const finalYear = targetMonth >= 12 ? targetYear + Math.floor(targetMonth / 12) : targetYear
    const finalMonth = targetMonth >= 12 ? targetMonth % 12 : targetMonth
    paymentDate.setFullYear(finalYear)
    paymentDate.setMonth(finalMonth)
    paymentDate.setDate(new Date(finalYear, finalMonth + 1, 0).getDate())
  } else if (client.payment_cycle_type === 'specific_date') {
    const closingDay = client.payment_cycle_closing_day || 25
    const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
    const paymentDay = client.payment_cycle_payment_day || 15

    if (end.getDate() <= closingDay) {
      paymentDate.setFullYear(end.getFullYear())
      paymentDate.setMonth(end.getMonth() + paymentMonthOffset)
      paymentDate.setDate(paymentDay)
    } else {
      paymentDate.setFullYear(end.getFullYear())
      paymentDate.setMonth(end.getMonth() + paymentMonthOffset + 1)
      paymentDate.setDate(paymentDay)
    }
  }

  return paymentDate
}

function calculateMonthlyRevenueFromProjects(
  projects: Project[],
  clients: Client[],
  caddonBillings: CaddonBilling[],
  fiscalInfo: FiscalInfo,
  splitBillings: SplitBilling[]
): MonthlyData[] {
  const monthlyMap: { [key: string]: number } = {}

  // 分割入金データをプロジェクト単位にまとめる
  const projectIdToSplit: { [pid: string]: { [monthKey: string]: number } } = {}
  splitBillings.forEach(sb => {
    if (!projectIdToSplit[sb.project_id]) projectIdToSplit[sb.project_id] = {}
    projectIdToSplit[sb.project_id][sb.billing_month] = (projectIdToSplit[sb.project_id][sb.billing_month] || 0) + (sb.amount || 0)
  })

  const filteredProjects = projects.filter(project => {
    const isCaddonSystem = (
      (project.business_number && project.business_number.startsWith('C')) ||
      (project.name && project.name.includes('CADDON'))
    )
    const isOverhead = (
      project.name === '一般管理費' ||
      project.business_number === 'OVERHEAD'
    )
    return !isCaddonSystem && !isOverhead
  })

  filteredProjects.forEach(project => {
    if (!(project.contract_amount && project.contract_amount > 0)) return

    // 分割入金がある場合はそれを優先
    const split = projectIdToSplit[project.id]
    if (split && Object.keys(split).length > 0) {
      Object.entries(split).forEach(([monthKey, amount]) => {
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + (amount || 0)
      })
      return
    }

    // 分割入金がなければ支払サイクルで単月計上
    if (project.end_date) {
      const client = clients.find(c => c.name === project.client_name)
      const payDate = calculatePaymentDateServer(project.end_date, client as Client)
      const mKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[mKey] = (monthlyMap[mKey] || 0) + (project.contract_amount || 0)
    } else {
      // 終了日がない場合は現在の会計期間に計上
      const mKey = `${fiscalInfo.fiscal_year}-${String(fiscalInfo.current_period || 1).padStart(2, '0')}`
      monthlyMap[mKey] = (monthlyMap[mKey] || 0) + (project.contract_amount || 0)
    }
  })

  // CADDON請求も収入として計上（total_amount を優先）
  caddonBillings.forEach(billing => {
    const billingDate = new Date(billing.billing_month)
    const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
    const amount = (billing.total_amount ?? billing.amount ?? 0)
    monthlyMap[key] = (monthlyMap[key] || 0) + amount
  })

  // map -> MonthlyData[]
  const result: MonthlyData[] = Object.entries(monthlyMap).map(([key, amount]) => {
    const [yearStr, monthStr] = key.split('-')
    return {
      year: parseInt(yearStr, 10),
      month: parseInt(monthStr, 10),
      amount,
    }
  })

  return result
}

// 月別原価を計算する関数
function calculateMonthlyCost(
  costEntries: CostEntry[]
): MonthlyData[] {
  const monthlyCost: MonthlyData[] = []

  costEntries.forEach(entry => {
    const entryDate = new Date(entry.entry_date)
    const month = entryDate.getMonth() + 1
    const year = entryDate.getFullYear()

    const existingData = monthlyCost.find(
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
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
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
      .order('business_number', { ascending: true })

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

    // 分割入金データを取得（全プロジェクト）
    const { data: splitBillings } = await supabase
      .from('split_billing')
      .select('project_id, billing_month, amount')

    // 進捗データを取得（存在するテーブル名に合わせてください）
    const { data: progressRows } = await supabase
      .from('project_progress')
      .select('project_id, progress_percent, expected_end_date')

    // クッキーから決算情報を取得
    const allCookies = await cookies()
    const fiscalInfoCookie = allCookies.get('fiscal-info')

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

    // 年間入金予定表の月毎の金額を計算
    const monthlyRevenue = calculateMonthlyRevenueFromProjects(
      projects || [],
      clients || [],
      caddonBillings || [],
      fiscalInfo,
      splitBillings || []
    )

    const monthlyCost = calculateMonthlyCost(
      costEntries || []
    )

    console.log('月別収入データ:', monthlyRevenue)
    console.log('月別原価データ:', monthlyCost)

    // 銀行残高履歴から最新の月末残高を取得
    const { data: bankBalanceHistory } = await supabase
      .from('bank_balance_history')
      .select('*')
      .order('balance_date', { ascending: false })
      .limit(1)

    // 予測データを生成（決算月の翌月1日から開始）
    const predictions = []
    const settlementMonth = fiscalInfo.settlement_month
    // 決算月の翌月を計算（例: 決算月3月 → 開始月4月）
    const nextMonth = settlementMonth === 12 ? 1 : settlementMonth + 1
    const nextYear = settlementMonth === 12 ? fiscalInfo.fiscal_year + 1 : fiscalInfo.fiscal_year
    
    // 銀行残高履歴から初期残高を取得、なければfiscalInfo.bank_balanceを使用
    let runningBalance = bankBalanceHistory && bankBalanceHistory.length > 0 
      ? bankBalanceHistory[0].closing_balance 
      : fiscalInfo.bank_balance

    console.log(`決算月: ${settlementMonth}月, 翌月: ${nextMonth}月 (${nextYear}年)`)
    console.log(`予測開始日付: ${nextYear}年${nextMonth}月1日`)
    console.log(`初期残高: ${runningBalance} (銀行残高履歴: ${bankBalanceHistory?.[0]?.closing_balance || 'なし'}, fiscalInfo: ${fiscalInfo.bank_balance})`)

    // 進捗データをプロジェクトID -> 進捗 へ変換
    const projectIdToProgress: Record<string, { progress: number; expectedEnd: Date | null }> = {}
    ;(progressRows || []).forEach((row: any) => {
      projectIdToProgress[row.project_id] = {
        progress: Math.min(Math.max(row.progress_percent ?? 0, 0), 100),
        expectedEnd: row.expected_end_date ? new Date(row.expected_end_date) : null
      }
    })

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

      // 月表示のみの文字列を生成
      const dateString = `${year}年${month}月`

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

      // 信頼度の重み付け
      // 1) 予測根拠: 分割入金/終了日/CADDON請求の有無で重み
      // 2) 進捗率: progress_percent
      // 3) 終了日と対象月の距離: 予定通り終わる確率
      // 簡易実装: month毎の代表プロジェクトの指標を平均化
      const monthKey: MonthKey = `${year}-${String(month).padStart(2, '0')}`
      const monthProjects = (projects || []).filter(p => {
        // 対象月に入金予定があるか（分割入金 or 終了日支払）
        const splits = (splitBillings || []).filter(sb => sb.project_id === p.id && sb.billing_month === monthKey)
        const hasSplit = splits.length > 0
        const payDate = p.end_date ? calculatePaymentDateServer(p.end_date as string, (clients || []).find(c => c.name === p.client_name) as any) : null
        const payKey = payDate ? `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}` : ''
        const hasEndPay = !!p.end_date && payKey === monthKey
        const isCaddon = (p.business_number && p.business_number.startsWith('C')) || (p.name && p.name.includes('CADDON'))
        return hasSplit || hasEndPay || isCaddon
      })

      let basisWeight = 0
      let progressWeight = 0
      let finishWeight = 0
      if (monthProjects.length > 0) {
        monthProjects.forEach(p => {
          const splits = (splitBillings || []).filter(sb => sb.project_id === p.id && sb.billing_month === monthKey)
          const hasSplit = splits.length > 0
          const isCaddon = (p.business_number && p.business_number.startsWith('C')) || (p.name && p.name.includes('CADDON'))
          const payDate = p.end_date ? calculatePaymentDateServer(p.end_date as string, (clients || []).find(c => c.name === p.client_name) as any) : null
          const payKey = payDate ? `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}` : ''
          const hasEndPay = !!p.end_date && payKey === monthKey
          // 根拠: 分割入金(1.0) / 終了日(0.9) / CADDON(1.0) を最大で採用
          const basis = hasSplit ? 1.0 : hasEndPay ? 0.9 : isCaddon ? 1.0 : 0.6
          basisWeight += basis

          // 進捗: 0..1
          const prg = projectIdToProgress[p.id]?.progress ?? 50
          progressWeight += prg / 100

          // 予定通り終わる確率（終了日との差が小さいほど高い）
          const expEnd = projectIdToProgress[p.id]?.expectedEnd
          if (expEnd) {
            const diffMonths = Math.abs((expEnd.getFullYear() - year) * 12 + (expEnd.getMonth() + 1 - month))
            const finish = 1 / (1 + diffMonths / 3) // 差3ヶ月で約0.5
            finishWeight += finish
          } else {
            finishWeight += 0.7
          }
        })
        basisWeight /= monthProjects.length
        progressWeight /= monthProjects.length
        finishWeight /= monthProjects.length
      } else {
        basisWeight = 0.7; progressWeight = 0.7; finishWeight = 0.7
      }

      const confidence = Math.max(0.4, Math.min(0.98, 0.4 * basisWeight + 0.35 * progressWeight + 0.25 * finishWeight))

      predictions.push({
        date: dateString,
        predicted_inflow: Math.round(predictedInflow),
        predicted_outflow: Math.round(predictedOutflow),
        predicted_balance: Math.round(runningBalance),
        confidence_score: confidence,
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
