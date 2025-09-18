'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  Activity,
  BarChart,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

// 追加のインターフェース定義
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

interface MonthlyData {
  month: number
  year: number
  amount: number
}

interface BankBalanceHistory {
  id: string
  fiscal_year: number
  balance_date: string
  opening_balance: number
  closing_balance: number
  total_income: number
  total_expense: number
}

interface AIPrediction {
  type: 'cash_shortage' | 'surplus' | 'optimal' | 'warning'
  confidence: number
  message: string
  recommended_action: string
  predicted_balance: number
  risk_level: 'low' | 'medium' | 'high'
  time_horizon: string
}

interface DetailedCashFlowPrediction {
  date: string
  predicted_inflow: number
  predicted_outflow: number
  predicted_balance: number
  confidence_score: number
  risk_level: 'low' | 'medium' | 'high'
  factors: {
    seasonal_trend: number
    historical_pattern: number
    project_cycle: number
    market_conditions: number
  }
  recommendations: string[]
}

// AI分析結果のインターフェース
interface AIAnalysisResult {
  riskAnalysis: {
    highRiskPeriods: {
      months: string[]
      riskFactors: string[]
      severity: 'high' | 'medium' | 'low'
      recommendations: string[]
    }
    seasonalRisks: {
      winterRisk: boolean
      yearEndRisk: boolean
      fiscalYearEndRisk: boolean
      riskFactors: string[]
      recommendations: string[]
    }
  }
  growthOpportunities: {
    highGrowthMonths: string[]
    potentialProjects: string[]
    marketTrends: string[]
    recommendations: string[]
  }
  overallAssessment: {
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    summary: string
    keyActions: string[]
  }
}

interface PredictionSummary {
  total_predicted_inflow: number
  total_predicted_outflow: number
  net_cash_flow: number
  average_balance: number
  minimum_balance: number
  maximum_balance: number
  high_risk_months: number
  average_confidence: number
}

interface CashFlowAnalysis {
  current_balance: number
  average_monthly_income: number
  average_monthly_expense: number
  balance_trend: 'increasing' | 'decreasing' | 'stable'
  burn_rate: number // 月間消費率
  runway_months: number // 残存月数
  predictions: AIPrediction[]
}

export default function AIEnhancedCashFlow() {
  const [analysis, setAnalysis] = useState<CashFlowAnalysis | null>(null)
  const [history, setHistory] = useState<BankBalanceHistory[]>([])
  const [detailedPredictions, setDetailedPredictions] = useState<DetailedCashFlowPrediction[]>([])
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null)
  const [fiscalInfo, setFiscalInfo] = useState<{
    id: string
    fiscal_year: number
    settlement_month: number
    current_period: number
    bank_balance: number
    notes: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'analysis'>('overview')
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [monthlyRevenueTotals, setMonthlyRevenueTotals] = useState<MonthlyData[]>([])
  const [totalIncome, setTotalIncome] = useState<number>(0)
  const [totalExpense, setTotalExpense] = useState<number>(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [caddonBillings, setCaddonBillings] = useState<CaddonBilling[]>([])
  const [newCompanyMessage, setNewCompanyMessage] = useState<string | null>(null)

  // 年間入金予定表と同じ入金予定日計算関数
  const calculatePaymentDate = (endDate: string, client: any): Date => {
    if (!endDate || !client.payment_cycle_type) {
      return new Date(endDate || new Date())
    }

    const end = new Date(endDate)
    const paymentDate = new Date()

    if (client.payment_cycle_type === 'month_end') {
      // 月末締め翌月末払いの場合
      const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
      
      // 完了月から支払い月オフセット分を加算
      const targetYear = end.getFullYear()
      const targetMonth = end.getMonth() + paymentMonthOffset
      
      // 年をまたぐ場合の処理
      const finalYear = targetMonth >= 12 ? targetYear + Math.floor(targetMonth / 12) : targetYear
      const finalMonth = targetMonth >= 12 ? targetMonth % 12 : targetMonth
      
      paymentDate.setFullYear(finalYear)
      paymentDate.setMonth(finalMonth)
      paymentDate.setDate(new Date(finalYear, finalMonth + 1, 0).getDate()) // その月の末日
      
    } else if (client.payment_cycle_type === 'specific_date') {
      // 特定日締めの場合
      const closingDay = client.payment_cycle_closing_day || 25
      const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
      const paymentDay = client.payment_cycle_payment_day || 15

      if (end.getDate() <= closingDay) {
        // 締め日以前の場合は当月締め
        paymentDate.setFullYear(end.getFullYear())
        paymentDate.setMonth(end.getMonth() + paymentMonthOffset)
        paymentDate.setDate(paymentDay)
      } else {
        // 締め日以降の場合は翌月締め
        paymentDate.setFullYear(end.getFullYear())
        paymentDate.setMonth(end.getMonth() + paymentMonthOffset + 1)
        paymentDate.setDate(paymentDay)
      }
    }

    return paymentDate
  }

  // 分析・レポートと同じ計算ロジック
  const calculateMonthlyRevenue = (
    projects: Project[],
    caddonBillings: CaddonBilling[]
  ): MonthlyData[] => {

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
                const existingData = monthlyRevenue.find(
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

      const existingData = monthlyRevenue.find(
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

  const calculateMonthlyCost = (
    costEntries: CostEntry[]
  ): MonthlyData[] => {
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

  useEffect(() => {
    initializeData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeData = async () => {
    await Promise.all([
      fetchFiscalInfo(),
      fetchBankBalanceHistory(),
      fetchDetailedPredictions(),
      fetchProjectsAndCaddon()
    ])
    setLoading(false)
  }

  const fetchFiscalInfo = async () => {
    try {
      const response = await fetch('/api/fiscal-info')
      if (response.ok) {
        const data = await response.json()
        setFiscalInfo(data.fiscalInfo)
      }
    } catch (error) {
      console.error('決算情報取得エラー:', error)
    }
  }

  const fetchBankBalanceHistory = async () => {
    try {
      const response = await fetch('/api/bank-balance-history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('銀行残高履歴取得エラー:', error)
    }
  }

    const fetchProjectsAndCaddon = async () => {
    try {
      const supabase = createClientComponentClient()
      
      // プロジェクトデータを取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('business_number', { ascending: true })
      
      // CADDON請求データを取得
      const { data: caddonData } = await supabase
        .from('caddon_billing')
        .select('*')
        .order('billing_month')
      
      setProjects(projectsData || [])
      setCaddonBillings(caddonData || [])
      
      // 年間入金予定表の年間合計金額を直接取得
      try {
        const response = await fetch('/api/annual-revenue-total')
        if (response.ok) {
          const data = await response.json()
          const annualTotal = data.annualTotal || 0
          setTotalIncome(annualTotal)
        } else {
          console.error('年間入金予定表APIエラー:', response.status)
          setTotalIncome(0)
        }
      } catch (error) {
        console.error('年間入金予定表取得エラー:', error)
        setTotalIncome(0)
      }
      
    } catch (error) {
      console.error('プロジェクト・CADDONデータ取得エラー:', error)
    }
  }

  const fetchDetailedPredictions = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const response = await fetch(`/api/cash-flow-prediction?fiscal_year=${currentYear}&months=12`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDetailedPredictions(data.predictions || [])
        setPredictionSummary(data.summary)
        
        // 新規法人の場合のメッセージを表示
        if (data.message) {
          setNewCompanyMessage(data.message)
        } else {
          setNewCompanyMessage(null)
        }
      }
    } catch (error) {
      console.error('詳細予測取得エラー:', error)
    }
  }

  const fetchAnnualRevenueSchedule = async () => {
    try {
      const response = await fetch('/api/annual-revenue-schedule')
      
      if (response.ok) {
        const data = await response.json()
        console.log('取得した年間入金予定表データ:', data)
        return data.monthlyTotals || []
      } else {
        console.log('年間入金予定表APIレスポンスがNG:', response.status)
      }
    } catch (error) {
      console.error('年間入金予定表取得エラー:', error)
    }
    return []
  }

      const createDetailedPredictionsFromAnnualRevenue = (monthlyTotals: MonthlyData[]) => {
      // 年間入金予定表のデータを月次予測詳細の形式に変換
      const predictions: DetailedCashFlowPrediction[] = []
      
      // 現在の残高を計算（管理者パネルの銀行残高履歴管理から取得）
      let currentBalance = 0
      if (history && history.length > 0) {
        // 銀行残高履歴の最新データから初期残高を取得
        const latestBalance = history[0]
        currentBalance = latestBalance.closing_balance || 0
        console.log(`💰 AIEnhancedCashFlow: 銀行残高履歴から初期残高を取得: ${currentBalance} (${latestBalance.balance_date})`)
      } else {
        // 銀行残高履歴がない場合は決算情報の銀行残高を使用
        currentBalance = fiscalInfo?.bank_balance || 0
        console.log(`💰 AIEnhancedCashFlow: 決算情報から初期残高を取得: ${currentBalance}`)
      }
      
      let runningBalance = currentBalance // 現在の残高

    monthlyTotals.forEach((revenue, index) => {
      const month = revenue.month
      const year = revenue.year
      const dateString = `${year}年${month}月`
      
      // 仮の月間支出（実際のデータがある場合は置き換え）
      const monthlyExpense = month === 8 ? 8958429 : month === 9 ? 200000 : month === 10 ? 100000 : month === 11 ? 200000 : month === 12 ? 200000 : 0
      
      runningBalance = runningBalance + revenue.amount - monthlyExpense

      predictions.push({
        date: dateString,
        predicted_inflow: revenue.amount,
        predicted_outflow: monthlyExpense,
        predicted_balance: runningBalance,
        confidence_score: 0.85,
        risk_level: monthlyExpense > revenue.amount ? 'high' : monthlyExpense > revenue.amount * 0.8 ? 'medium' : 'low',
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
    })

    return predictions
  }

  const generateAIAnalysis = async () => {
    setGenerating(true)
    try {
      // 分析・レポートと同じデータソースを使用
      const supabase = createClientComponentClient()

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



      // CADDON請求データを取得
      const { data: caddonBillings } = await supabase
        .from('caddon_billing')
        .select('*')
        .order('billing_month')

      // 最新の銀行残高履歴から現在の残高を取得
      let currentBalance = fiscalInfo?.bank_balance || 0
      
      // 銀行残高履歴がある場合は、最新の月末残高を使用
      if (history && history.length > 0) {
        const latestBalance = history[0] // 最新のデータ
        // closing_balanceは既にその月の収支を含んだ月末残高なので、そのまま使用
        currentBalance = latestBalance.closing_balance || currentBalance
        console.log('💰 銀行残高履歴から現在の残高を取得:', currentBalance, '日付:', latestBalance.balance_date)
      } else {
        // 銀行残高履歴がない場合は決算情報の銀行残高を使用
        currentBalance = fiscalInfo?.bank_balance || 0
        console.log('💰 決算情報から現在の残高を取得:', currentBalance)
      }

      // 予測は常にAPIから取得して一貫性を保つ
      const currentYear = new Date().getFullYear()
      const predictionRes = await fetch(`/api/cash-flow-prediction?fiscal_year=${currentYear}&months=12`, {
        credentials: 'include'
      })
      let predData: any = null
      if (predictionRes.ok) {
        predData = await predictionRes.json()
        setDetailedPredictions(predData.predictions || [])
        setPredictionSummary(predData.summary)
        console.log('再分析: /api/cash-flow-prediction から取得した詳細予測:', predData)
      } else {
        console.error('再分析時の詳細予測取得に失敗しました:', predictionRes.status)
      }
      
      // 分析・レポートと同じ計算ロジックを使用
      const monthlyRevenue = calculateMonthlyRevenue(
        projects || [],
        caddonBillings || []
      )

      const monthlyCost = calculateMonthlyCost(
        costEntries || []
      )

      // 年間入金予定表から正確な年間合計を取得
      try {
        const response = await fetch('/api/annual-revenue-total')
        if (response.ok) {
          const data = await response.json()
          const annualTotal = data.annualTotal || 0
          setTotalIncome(annualTotal)
          console.log('再分析: 年間入金予定表から取得した年間合計:', annualTotal)
        } else {
          console.error('再分析: 年間入金予定表APIエラー:', response.status)
          // フォールバック: 予測データから計算
          const monthlyRevenueTotalsFromPred: MonthlyData[] = (predData?.predictions || []).map((p: any) => {
            if (typeof p.date === 'string' && p.date.includes('年') && p.date.includes('月')) {
              const m = p.date.match(/(\d+)年(\d+)月/)
              const year = m ? parseInt(m[1], 10) : new Date().getFullYear()
              const month = m ? parseInt(m[2], 10) : 1
              return { year, month, amount: p.predicted_inflow as number }
            }
            const d = new Date(p.date)
            return { year: d.getFullYear(), month: d.getMonth() + 1, amount: p.predicted_inflow as number }
          })
          setMonthlyRevenueTotals(monthlyRevenueTotalsFromPred)
          const totalIncome = monthlyRevenueTotalsFromPred.reduce((s, r) => s + r.amount, 0)
          setTotalIncome(totalIncome)
        }
      } catch (error) {
        console.error('再分析: 年間入金予定表取得エラー:', error)
        // フォールバック: 予測データから計算
        const monthlyRevenueTotalsFromPred: MonthlyData[] = (predData?.predictions || []).map((p: any) => {
          if (typeof p.date === 'string' && p.date.includes('年') && p.date.includes('月')) {
            const m = p.date.match(/(\d+)年(\d+)月/)
            const year = m ? parseInt(m[1], 10) : new Date().getFullYear()
            const month = m ? parseInt(m[2], 10) : 1
            return { year, month, amount: p.predicted_inflow as number }
          }
          const d = new Date(p.date)
          return { year: d.getFullYear(), month: d.getMonth() + 1, amount: p.predicted_inflow as number }
        })
        setMonthlyRevenueTotals(monthlyRevenueTotalsFromPred)
        const totalIncome = monthlyRevenueTotalsFromPred.reduce((s, r) => s + r.amount, 0)
        setTotalIncome(totalIncome)
      }

      const totalExpense = (predData?.predictions || []).reduce((s: number, p: any) => s + (p.predicted_outflow || 0), 0)
      setTotalExpense(totalExpense)

      // 年間入金予定表と突き合わせ（ログのみ）
      try {
        const annual = await fetchAnnualRevenueSchedule()
        if (annual.length > 0) {
          const diff = totalIncome - annual.reduce((s: number, r: any) => s + r.amount, 0)
          console.log('年間入金予定表と予測収入の差分(ログのみ):', diff)
        }
      } catch (e) {
        console.warn('年間入金予定表の照合に失敗:', e)
      }
      
      // 銀行残高履歴から月間収入・支出を計算（より正確）
      let averageMonthlyIncome = 0
      let averageMonthlyExpense = 0
      
      if (history && history.length > 0) {
        const totalIncomeFromHistory = history.reduce((sum, record) => sum + (record.total_income || 0), 0)
        const totalExpenseFromHistory = history.reduce((sum, record) => sum + (record.total_expense || 0), 0)
        const monthCount = history.length
        
        averageMonthlyIncome = monthCount > 0 ? totalIncomeFromHistory / monthCount : 0
        averageMonthlyExpense = monthCount > 0 ? totalExpenseFromHistory / monthCount : 0
      } else {
        // フォールバック: プロジェクトデータから計算
        averageMonthlyIncome = monthlyRevenue.length > 0 ? totalIncome / monthlyRevenue.length : 0
        averageMonthlyExpense = monthlyCost.length > 0 ? totalExpense / monthlyCost.length : 0
      }

      // 残存月数を計算
      const burnRate = averageMonthlyExpense > 0 ? averageMonthlyExpense : 1
      const runwayMonths = currentBalance / burnRate

      // 残高推移を分析（収入・支出データから計算）
      let balance_trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (monthlyRevenue.length >= 2 && monthlyCost.length >= 2) {
        // 直近2ヶ月の収入・支出バランスを比較
        const recentRevenue = monthlyRevenue.slice(-2).reduce((sum, r) => sum + r.amount, 0) / 2
        const recentCost = monthlyCost.slice(-2).reduce((sum, c) => sum + c.amount, 0) / 2
        const earlierRevenue = monthlyRevenue.slice(-4, -2).reduce((sum, r) => sum + r.amount, 0) / 2 || recentRevenue
        const earlierCost = monthlyCost.slice(-4, -2).reduce((sum, c) => sum + c.amount, 0) / 2 || recentCost

        const recentBalance = recentRevenue - recentCost
        const earlierBalance = earlierRevenue - earlierCost
        const change = earlierBalance > 0 ? ((recentBalance - earlierBalance) / earlierBalance) * 100 : 0

        if (change > 10) balance_trend = 'increasing'
        else if (change < -10) balance_trend = 'decreasing'
      }

      // AI予測を生成
      const predictions: AIPrediction[] = []

      // 資金ショート予測
      if (runwayMonths < 3) {
        predictions.push({
          type: 'cash_shortage',
          confidence: Math.min(95, 90 - (runwayMonths * 10)),
          message: `残存期間が${runwayMonths.toFixed(1)}ヶ月と短くなっています。`,
          recommended_action: '緊急の資金調達または支出削減を検討してください。',
          predicted_balance: currentBalance - (averageMonthlyExpense * 3),
          risk_level: 'high',
          time_horizon: '3ヶ月以内'
        })
      }

      // 資金余剰予測
      if (runwayMonths > 12 && averageMonthlyIncome > averageMonthlyExpense * 1.5) {
        predictions.push({
          type: 'surplus',
          confidence: 85,
          message: `資金に余裕があり、安定したキャッシュフローがあります。`,
          recommended_action: '投資機会の検討や新規プロジェクトへの投資を検討できます。',
          predicted_balance: currentBalance + (averageMonthlyIncome - averageMonthlyExpense) * 6,
          risk_level: 'low',
          time_horizon: '6ヶ月後'
        })
      }

      // 最適化提案
      if (balance_trend === 'stable' && runwayMonths >= 6) {
        predictions.push({
          type: 'optimal',
          confidence: 78,
          message: '現在のキャッシュフローは安定しています。',
          recommended_action: '現在の財務状態を維持しつつ、成長機会を模索してください。',
          predicted_balance: currentBalance + (averageMonthlyIncome - averageMonthlyExpense) * 3,
          risk_level: 'low',
          time_horizon: '3ヶ月後'
        })
      }

      // 支出超過の警告
      if (averageMonthlyExpense > averageMonthlyIncome * 1.2) {
        predictions.push({
          type: 'warning',
          confidence: 88,
          message: '支出が収入を上回る傾向があります。',
          recommended_action: '支出削減策の実施または収入源の拡大を検討してください。',
          predicted_balance: currentBalance - ((averageMonthlyExpense - averageMonthlyIncome) * 2),
          risk_level: 'medium',
          time_horizon: '2ヶ月後'
        })
      }

      const cashFlowAnalysis: CashFlowAnalysis = {
        current_balance: currentBalance,
        average_monthly_income: averageMonthlyIncome,
        average_monthly_expense: averageMonthlyExpense,
        balance_trend,
        burn_rate: burnRate,
        runway_months: runwayMonths,
        predictions
      }

      setAnalysis(cashFlowAnalysis)

    } catch (error) {
      console.error('AI分析エラー:', error)
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPredictionIcon = (type: AIPrediction['type']) => {
    switch (type) {
      case 'cash_shortage': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'surplus': return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'optimal': return <CheckCircle className="h-5 w-5 text-blue-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Brain className="h-5 w-5 text-gray-500" />
    }
  }

  const getPredictionColor = (type: AIPrediction['type']) => {
    switch (type) {
      case 'cash_shortage': return 'border-red-200 bg-red-50'
      case 'surplus': return 'border-green-200 bg-green-50'
      case 'optimal': return 'border-blue-200 bg-blue-50'
      case 'warning': return 'border-yellow-200 bg-yellow-500'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  // AI分析を実行する関数
  const performAIAnalysis = async () => {
    if (!detailedPredictions.length) return

    try {
      setAiAnalysisLoading(true)
      
      // プロジェクトデータを取得
      const supabase = createClientComponentClient()
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('business_number', { ascending: true })

      // AI分析APIを呼び出し
      const response = await fetch('/api/ai-cash-flow-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictions: detailedPredictions,
          projects: projects || [],
          fiscalInfo
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAiAnalysisResult(result.analysis)
        console.log('AI分析結果:', result.analysis)
      } else {
        console.error('AI分析APIエラー:', response.status)
      }
    } catch (error) {
      console.error('AI分析実行エラー:', error)
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI分析ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">AI資金分析</h3>
          </div>
          <button
            onClick={() => generateAIAnalysis()}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                分析中...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                再分析
              </>
            )}
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          銀行残高データを基にしたAI分析と予測を行います
        </p>

        {/* タブナビゲーション */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              概要分析
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predictions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LineChart className="h-4 w-4 inline mr-2" />
              詳細予測（決算月の翌月から）
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart className="h-4 w-4 inline mr-2" />
              リスク分析
            </button>
          </nav>
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 現在の資金状況 */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      現在の残高
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(analysis.current_balance)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      月間平均収入
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(analysis.average_monthly_income)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      月間平均支出
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(analysis.average_monthly_expense)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      残存期間
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analysis.runway_months.toFixed(1)}ヶ月
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
          )}

          {/* AI予測結果 */}
          {analysis && analysis.predictions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI予測・推奨アクション
              </h3>
              <div className="space-y-4">
                {analysis.predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getPredictionColor(prediction.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getPredictionIcon(prediction.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {prediction.message}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(prediction.risk_level)}`}>
                              {prediction.risk_level === 'high' ? '高リスク' :
                               prediction.risk_level === 'medium' ? '中リスク' : '低リスク'}
                            </span>
                            <span className="text-xs text-gray-500">
                              信頼度: {Math.round(prediction.confidence)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>推奨アクション:</strong> {prediction.recommended_action}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className={prediction.predicted_balance < 0 ? 'text-red-600' : ''}>
                            予測残高: {formatCurrency(prediction.predicted_balance)}
                          </span>
                          <span>期間: {prediction.time_horizon}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 残高推移分析 */}
          {history.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">残高推移分析</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年月
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期首残高
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期末残高
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    収入
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支出
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.slice(0, 10).map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.balance_date).getFullYear()}年{new Date(record.balance_date).getMonth() + 1}月
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.opening_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.closing_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{formatCurrency(record.total_income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(record.total_expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
        </div>
      )}

      {/* 詳細予測タブ */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* サマリー（AI分析結果がなくても詳細予測があれば表示） */}
          {(detailedPredictions.length > 0 || aiAnalysisResult) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          予測総収入
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(totalIncome)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingDown className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          予測総支出
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(
                            detailedPredictions.length > 0
                              ? detailedPredictions.reduce((sum, p) => sum + p.predicted_outflow, 0)
                              : 0
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          純キャッシュフロー
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(
                            detailedPredictions.length > 0
                              ? detailedPredictions.reduce((sum, p) => sum + (p.predicted_inflow - p.predicted_outflow), 0)
                              : 0
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          高リスク月数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {detailedPredictions.length > 0
                            ? `${detailedPredictions.filter(p => p.risk_level === 'high').length}ヶ月`
                            : '0ヶ月'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 月次予測詳細グラフ */}
          {detailedPredictions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                月次予測詳細グラフ
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={detailedPredictions}>
                    <defs>
                      <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        if (typeof date === 'string' && date.includes('年') && date.includes('月')) {
                          const m = date.match(/(\d+)月/)
                          const month = m ? parseInt(m[1], 10) : NaN
                          return Number.isFinite(month) ? `${month}月` : date
                        }
                        const d = new Date(date as string)
                        return Number.isFinite(d.getTime()) ? `${d.getMonth() + 1}月` : String(date)
                      }}
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'predicted_inflow' ? '予測収入' :
                        name === 'predicted_outflow' ? '予測支出' : '予測残高'
                      ]}
                      labelFormatter={(date) => {
                        if (typeof date === 'string' && date.includes('年') && date.includes('月')) {
                          return `日付: ${date}`
                        }
                        const d = new Date(date as string)
                        return `日付: ${Number.isFinite(d.getTime()) ? d.toLocaleDateString('ja-JP') : String(date)}`
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_inflow"
                      stroke="#10B981"
                      fill="url(#inflowGradient)"
                      name="predicted_inflow"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_outflow"
                      stroke="#EF4444"
                      fill="url(#outflowGradient)"
                      name="predicted_outflow"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted_balance"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="predicted_balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 新規法人メッセージ */}
          {newCompanyMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    新規法人のため予測データがありません
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{newCompanyMessage}</p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
                        onClick={() => setNewCompanyMessage(null)}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 詳細予測データテーブル */}
          {detailedPredictions.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">月次予測詳細</h3>
                <p className="mt-1 text-sm text-gray-500">
                  決算月の翌月から始まる12ヶ月分の詳細予測
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        月
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予測収入
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予測支出
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予測残高
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        信頼度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        リスクレベル
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailedPredictions.map((prediction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prediction.date.includes('年') && prediction.date.includes('月') 
                            ? prediction.date 
                            : new Date(prediction.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          +{formatCurrency(prediction.predicted_inflow)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          -{formatCurrency(prediction.predicted_outflow)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(prediction.predicted_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(prediction.confidence_score * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prediction.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                            prediction.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {prediction.risk_level === 'high' ? '高' :
                             prediction.risk_level === 'medium' ? '中' : '低'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* リスク分析タブ */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* AI分析実行ボタン */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI分析実行
              </h3>
              <button
                onClick={performAIAnalysis}
                disabled={aiAnalysisLoading || !detailedPredictions.length}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiAnalysisLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    分析中...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    AI分析を実行
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600">
              詳細な予測データを基に、AIが高リスク期間、季節性リスク、成長機会を分析します。
            </p>
          </div>

          {/* AI分析結果 */}
          {aiAnalysisResult && (
            <div className="space-y-6">
              {/* 全体的なリスク評価 */}
              <div className={`bg-white shadow rounded-lg p-6 border-l-4 ${
                aiAnalysisResult.overallAssessment.riskLevel === 'high' ? 'border-red-500' :
                aiAnalysisResult.overallAssessment.riskLevel === 'medium' ? 'border-yellow-500' :
                'border-green-500'
              }`}>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  全体的なリスク評価
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      aiAnalysisResult.overallAssessment.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      aiAnalysisResult.overallAssessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      リスクレベル: {aiAnalysisResult.overallAssessment.riskLevel === 'high' ? '高' :
                                   aiAnalysisResult.overallAssessment.riskLevel === 'medium' ? '中' : '低'}
                    </span>
                    <span className="text-sm text-gray-600">
                      信頼度: {(aiAnalysisResult.overallAssessment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-gray-700">{aiAnalysisResult.overallAssessment.summary}</p>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-2">キーアクション:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {aiAnalysisResult.overallAssessment.keyActions.map((action, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 高リスク期間の検知 */}
              {aiAnalysisResult.riskAnalysis.highRiskPeriods.months.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    高リスク期間の検知
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        aiAnalysisResult.riskAnalysis.highRiskPeriods.severity === 'high' ? 'bg-red-100 text-red-800' :
                        aiAnalysisResult.riskAnalysis.highRiskPeriods.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        リスク度: {aiAnalysisResult.riskAnalysis.highRiskPeriods.severity === 'high' ? '高' :
                                 aiAnalysisResult.riskAnalysis.highRiskPeriods.severity === 'medium' ? '中' : '低'}
                      </span>
                      <span className="text-sm text-gray-600">
                        高リスク月: {aiAnalysisResult.riskAnalysis.highRiskPeriods.months.join(', ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">リスク要因:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {aiAnalysisResult.riskAnalysis.highRiskPeriods.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">推奨対策:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {aiAnalysisResult.riskAnalysis.highRiskPeriods.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 季節性リスクの検知 */}
              {(aiAnalysisResult.riskAnalysis.seasonalRisks.winterRisk || 
                aiAnalysisResult.riskAnalysis.seasonalRisks.yearEndRisk || 
                aiAnalysisResult.riskAnalysis.seasonalRisks.fiscalYearEndRisk) && (
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                    季節性リスクの検知
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">検知されたリスク:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {aiAnalysisResult.riskAnalysis.seasonalRisks.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">季節性対策:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {aiAnalysisResult.riskAnalysis.seasonalRisks.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 成長機会の検知 */}
              {(aiAnalysisResult.growthOpportunities.highGrowthMonths.length > 0 || 
                aiAnalysisResult.growthOpportunities.potentialProjects.length > 0) && (
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    成長機会の検知
                  </h3>
                  <div className="space-y-3">
                    {aiAnalysisResult.growthOpportunities.highGrowthMonths.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-2">高成長月:</p>
                        <p className="text-sm text-gray-700">
                          {aiAnalysisResult.growthOpportunities.highGrowthMonths.join(', ')}
                        </p>
                      </div>
                    )}
                    {aiAnalysisResult.growthOpportunities.potentialProjects.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-2">潜在的なプロジェクト機会:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {aiAnalysisResult.growthOpportunities.potentialProjects.map((project, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {project}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiAnalysisResult.growthOpportunities.marketTrends.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-2">市場トレンド:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {aiAnalysisResult.growthOpportunities.marketTrends.map((trend, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              {trend}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">成長戦略:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {aiAnalysisResult.growthOpportunities.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* フォールバック不要 */}
        </div>
      )}
    </div>
  )
}
