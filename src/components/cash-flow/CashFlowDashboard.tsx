'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Zap,
  Brain,
} from 'lucide-react'
import AIEnhancedCashFlow from './AIEnhancedCashFlow'

interface CashFlowData {
  date: string
  inflow: number
  outflow: number
  balance: number
}

// AI分析結果の型（下部コンポーネントと同等）
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

interface PaymentData {
  id: string
  vendor: string
  amount: number
  dueDate: string
  type: string
  priority: number
  negotiable: boolean
}

interface FiscalInfo {
  id: string
  fiscal_year: number
  settlement_month: number
  current_period: number
  bank_balance: number
  notes: string | null
}

interface BankBalanceHistory {
  id: string
  fiscal_year: number
  balance_date: string
  opening_balance: number
  closing_balance: number
  total_income: number
  total_expense: number
  created_at: string
  updated_at: string
}

export default function CashFlowDashboard() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null)
  const [bankBalanceHistory, setBankBalanceHistory] = useState<BankBalanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchCashFlowData()
    fetchFiscalInfo()
    fetchBankBalanceHistory()
    fetchPaymentDataOnly() // 初回のみ実行

    // 自動更新を無効化（手動更新に変更）
    // const intervalId = setInterval(() => {
    //   fetchPaymentDataOnly()
    // }, 30000) // 30秒間隔

    // クリーンアップ関数
    // return () => {
    //   clearInterval(intervalId)
    // }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 予測データと決算情報が揃ったらAI分析を自動実行
  useEffect(() => {
    if (cashFlowData.length > 0 && fiscalInfo && !aiLoading) {
      runAIAnalysis(cashFlowData, fiscalInfo)
    }
  }, [cashFlowData, fiscalInfo])

  const runAIAnalysis = async (data: CashFlowData[], fi: FiscalInfo) => {
    try {
      setAiLoading(true)
      const supabase = createClientComponentClient()
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('business_number', { ascending: true })

      const response = await fetch('/api/ai-cash-flow-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: data.map(d => ({
            date: d.date,
            predicted_inflow: d.inflow,
            predicted_outflow: d.outflow,
            predicted_balance: d.balance,
          })),
          projects: projects || [],
          fiscalInfo: fi
        })
      })

      if (response.ok) {
        const res = await response.json()
        setAiResult(res.analysis as AIAnalysisResult)
      } else {
        console.error('AI分析APIエラー:', response.status)
      }
    } catch (e) {
      console.error('AI分析実行エラー:', e)
    } finally {
      setAiLoading(false)
    }
  }

  const fetchCashFlowData = async () => {
    try {
      // Supabaseクライアントを作成
      const supabase = createClientComponentClient()

      // APIからキャッシュフロー予測データを取得
      const response = await fetch('/api/cash-flow-prediction', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: AbortSignal.timeout(10000) // 10秒タイムアウト
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('APIレスポンスエラー:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText
        })
        throw new Error(`Failed to fetch cash flow data: ${response.status} ${response.statusText}`)
      }
      const predictionData = await response.json()

      if (predictionData.predictions && predictionData.predictions.length > 0) {
        // APIの予測データをチャート用データに変換
        const chartData: CashFlowData[] = predictionData.predictions.map((p: {
          date: string
          predicted_inflow: number
          predicted_outflow: number
          predicted_balance: number
        }) => ({ 
          date: p.date,
          inflow: p.predicted_inflow,
          outflow: p.predicted_outflow,
          balance: p.predicted_balance,
        }))
        setCashFlowData(chartData)
      } else {
        // フォールバック: サンプルデータを生成
        const sampleData: CashFlowData[] = []
        const currentYear = new Date().getFullYear()
        // 決算月に基づいて年度開始月を決定（決算月の翌月）
        const fiscalStartMonth = fiscalInfo ? fiscalInfo.settlement_month : 3 // デフォルトは3月決算
        const startDate = new Date(currentYear, fiscalStartMonth, 1) // 決算月の翌月を開始月とする
        // 現在の残高を計算して初期残高として使用
        const calculateCurrentBalance = () => {
          if (bankBalanceHistory && bankBalanceHistory.length > 0) {
            const latestBalance = bankBalanceHistory[0]
            const currentBalance = latestBalance.closing_balance || 0
            const currentMonthIncome = latestBalance.total_income || 0
            const currentMonthExpense = latestBalance.total_expense || 0
            return latestBalance.closing_balance + currentMonthIncome - currentMonthExpense
          } else if (fiscalInfo) {
            return fiscalInfo.bank_balance || 0
          }
          return 5000000 // デフォルト値
        }

        const initialBalance = calculateCurrentBalance()

        for (let i = 0; i < 12; i++) {
          const date = new Date(startDate)
          date.setMonth(startDate.getMonth() + i)
          
          const inflow = 15000000 + Math.random() * 5000000
          const outflow = 12000000 + Math.random() * 3000000
          const balance = inflow - outflow + (i > 0 ? sampleData[i-1].balance : initialBalance)
          
          sampleData.push({
            date: date.toISOString().split('T')[0],
            inflow: Math.round(inflow),
            outflow: Math.round(outflow),
            balance: Math.round(balance),
          })
        }
        setCashFlowData(sampleData)
      }

      // 支払いデータをデータベースから取得
      await fetchPaymentData(supabase)
    } catch (error) {
      console.error('Error fetching cash flow data:', error)
      console.error('エラーの詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      // エラー時はサンプルデータを表示
      const fallbackData: CashFlowData[] = []
      const currentYear = new Date().getFullYear()
      const startDate = new Date(currentYear, 3, 1)
      
      // 現在の残高を計算して初期残高として使用（正常時と同じ計算方法）
      const calculateCurrentBalance = () => {
        if (bankBalanceHistory && bankBalanceHistory.length > 0) {
          const latestBalance = bankBalanceHistory[0]
          const currentBalance = latestBalance.closing_balance || 0
          const currentMonthIncome = latestBalance.total_income || 0
          const currentMonthExpense = latestBalance.total_expense || 0
          return latestBalance.closing_balance + currentMonthIncome - currentMonthExpense
        } else if (fiscalInfo) {
          return fiscalInfo.bank_balance || 0
        }
        return 3000000 // デフォルト値
      }

      const initialBalance = calculateCurrentBalance()
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate)
        date.setMonth(startDate.getMonth() + i)
        
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          inflow: 15000000,
          outflow: 12000000,
          balance: initialBalance,
        })
      }
      setCashFlowData(fallbackData)
    } finally {
      setLoading(false)
    }
  }
  const fetchFiscalInfo = async () => {
    try {
      const response = await fetch('/api/fiscal-info')

      if (response.ok) {
        const data = await response.json()
        console.log('取得した決算情報:', data)
        if (data.fiscalInfo) {
          console.log('設定する決算情報:', data.fiscalInfo)
          setFiscalInfo(data.fiscalInfo)
        } else {
          console.log('fiscalInfoが空です')
        }
      } else {
        console.log('APIレスポンスがNG:', response.status)
      }
    } catch (error) {
      console.error('決算情報取得エラー:', error)
    }
  }

  const fetchBankBalanceHistory = async () => {
    try {
      console.log('fetchBankBalanceHistory開始')
      const response = await fetch('/api/bank-balance-history')
      console.log('銀行残高履歴APIレスポンス:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('取得した銀行残高履歴:', data)
        if (data.history) {
          console.log('設定する銀行残高履歴:', data.history)
          setBankBalanceHistory(data.history)
        } else {
          console.log('銀行残高履歴が空です')
          setBankBalanceHistory([])
        }
      } else {
        console.log('銀行残高履歴APIレスポンスがNG:', response.status)
        setBankBalanceHistory([])
      }
    } catch (error) {
      console.error('銀行残高履歴取得エラー:', error)
      setBankBalanceHistory([])
    }
  }

  // 支払いデータのみを定期的に更新
  const fetchPaymentDataOnly = async () => {
    try {
      const supabase = createClientComponentClient()
      const cidMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/) : null
      const cid = cidMatch ? decodeURIComponent(cidMatch[1]) : ''

      // 今後30日以内の支払い予定を取得
      const today = new Date()
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(today.getDate() + 30)

      console.log('支払いデータ自動更新:', {
        today: today.toISOString().split('T')[0],
        thirtyDaysLater: thirtyDaysLater.toISOString().split('T')[0]
      })

      // cost_entriesからデータを取得
      let costEntries: any[] | null = null
      let costError = null
      try {
        let costQuery = supabase
          .from('cost_entries')
          .select(`id, amount, entry_date, entry_type, company_name, description, project_id, company_id`)
          .gte('entry_date', today.toISOString().split('T')[0])
          .lte('entry_date', thirtyDaysLater.toISOString().split('T')[0])
          .order('entry_date', { ascending: true })
          .limit(10)
        if (cid) costQuery = costQuery.eq('company_id', cid)
        const result = await costQuery
        costEntries = result.data
        costError = result.error
      } catch (error) {
        // cost_entriesテーブルが存在しない場合は正常な動作として扱う
        costError = null
        costEntries = []
      }

      // salary_entriesからデータを取得
      let salaryData: any[] | null = null
      let salaryError = null
      try {
        let salaryQuery = supabase
          .from('salary_entries')
          .select(`id, salary_amount, salary_period_end, employee_name, employee_department, notes, created_at, company_id`)
          .gte('salary_period_end', today.toISOString().split('T')[0])
          .lte('salary_period_end', thirtyDaysLater.toISOString().split('T')[0])
          .order('salary_period_end', { ascending: true })
          .limit(10)
        if (cid) salaryQuery = salaryQuery.eq('company_id', cid)
        const result = await salaryQuery
        salaryData = result.data
        salaryError = result.error
      } catch (error) {
        // salary_entriesテーブルが存在しない場合は正常な動作として扱う
        salaryError = null
        salaryData = []
      }

      // エラーログは開発環境でのみ表示
      if (costError && salaryError && process.env.NODE_ENV === 'development') {
        console.log('支払いデータ取得: cost_entriesとsalary_entriesの両方でエラーが発生しましたが、処理を継続します')
      }

      // データを統合してPaymentData形式に変換
      const newPaymentData: PaymentData[] = []

      // cost_entriesのデータを追加
      if (costEntries && !costError) {
        costEntries.forEach(entry => {
          const vendor = entry.company_name || '不明な業者'
          const dueDate = entry.entry_date
          const amount = entry.amount

          // エントリータイプに応じた分類
          let entryType = 'その他'
          if (entry.entry_type === 'direct') {
            entryType = '直接費'
          } else if (entry.entry_type === 'indirect') {
            entryType = '間接費'
          } else if (entry.entry_type === 'outsourcing') {
            entryType = '委託費'
          } else if (entry.entry_type === 'salary_allocation') {
            entryType = '人件費'
          } else if (entry.entry_type === 'material') {
            entryType = '材料費'
          } else if (entry.entry_type === 'overhead') {
            entryType = '経費'
          } else {
            entryType = '一般管理費'
          }

          newPaymentData.push({
            id: entry.id,
            vendor,
            amount,
            dueDate,
            type: entryType,
            priority: 1,
            negotiable: entry.entry_type !== 'direct' && entry.entry_type !== 'salary_allocation'
          })
        })
      }

      // salary_entriesのデータを追加
      if (salaryData && !salaryError) {
        salaryData.forEach(entry => {
          const vendor = `${entry.employee_name}（${entry.employee_department || '部署不明'}）`
          const dueDate = entry.salary_period_end
          const amount = entry.salary_amount

          newPaymentData.push({
            id: entry.id,
            vendor,
            amount,
            dueDate,
            type: '給与',
            priority: 2,
            negotiable: false
          })
        })
      }

      // 日付順にソート
      newPaymentData.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

      // ステートを更新
      setPaymentData(newPaymentData)

      console.log('支払いデータ更新完了:', {
        count: newPaymentData.length
      })

    } catch (error) {
      console.error('支払いデータ自動更新エラー:', error)
    }
  }

  // 支払いデータをデータベースから取得
  const fetchPaymentData = async (supabaseClient: ReturnType<typeof createClientComponentClient>) => {
    try {
      // 今後30日以内の支払い予定を取得
      const today = new Date()
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(today.getDate() + 30)

      console.log('支払いデータ取得開始:', {
        today: today.toISOString().split('T')[0],
        thirtyDaysLater: thirtyDaysLater.toISOString().split('T')[0]
      })

      // cost_entriesテーブルが存在するか確認
      const { error: simpleError } = await supabaseClient
        .from('cost_entries')
        .select('count', { count: 'exact', head: true })

      console.log('cost_entriesテーブル存在確認:', {
        exists: !simpleError,
        error: simpleError?.message
      })

      // テーブルが存在しない場合はsalary_entriesからデータを取得
      if (simpleError) {
        console.log('cost_entriesテーブルが存在しないため、salary_entriesからデータを取得します')

        const { data: salaryData, error: salaryError } = await supabaseClient
          .from('salary_entries')
          .select(`
            id,
            salary_amount,
            salary_period_end,
            employee_name,
            employee_department,
            notes,
            created_at
          `)
          .gte('salary_period_end', today.toISOString().split('T')[0])
          .lte('salary_period_end', thirtyDaysLater.toISOString().split('T')[0])
          .order('salary_period_end', { ascending: true })
          .limit(20)

        console.log('salary_entriesクエリ結果:', { salaryData, salaryError })

        if (salaryError) {
          console.error('salary_entries取得エラー:', salaryError)
          setPaymentData([
            {
              id: 'error-1',
              vendor: `データ取得エラー: ${salaryError.message}`,
              amount: 0,
              dueDate: today.toISOString().split('T')[0],
              type: 'エラー',
              priority: 1,
              negotiable: false,
            }
          ])
          return
        }

        if (salaryData && salaryData.length > 0) {
          // salary_entriesデータをPaymentData形式に変換（payment_dateは無いのでsalary_period_endを使用）
          const paymentData: PaymentData[] = salaryData.map((entry: {
            id: string
            salary_amount: number
            salary_period_end: string
            employee_name: string
            employee_department: string | null
          }) => {
            const dueDateObj = new Date(entry.salary_period_end)
            const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            let priority = 5
            if (daysUntilDue <= 3) priority = 10
            else if (daysUntilDue <= 7) priority = 8
            else if (daysUntilDue <= 14) priority = 6

            return {
              id: entry.id,
              vendor: `${entry.employee_name} (${entry.employee_department || '部署不明'})`,
              amount: entry.salary_amount,
              dueDate: entry.salary_period_end,
              type: '人件費',
              priority,
              negotiable: false,
            }
          })

          setPaymentData(paymentData)
          return
        }
      }

      // 原価入力（cost_entries）と給与入力（salary_entries）の両方からデータを取得
      console.log('原価入力と給与入力から支払いデータを取得します')

      // cost_entriesからデータを取得
      const { data: costEntries, error: costError } = await supabaseClient
        .from('cost_entries')
        .select(`
          id,
          amount,
          entry_date,
          entry_type,
          company_name,
          description,
          project_id
        `)
        .gte('entry_date', today.toISOString().split('T')[0])
        .lte('entry_date', thirtyDaysLater.toISOString().split('T')[0])
        .order('entry_date', { ascending: true })
        .limit(10)

      console.log('cost_entriesクエリ結果:', { costEntries, costError })

      // salary_entriesからデータを取得
      const { data: salaryData, error: salaryError } = await supabaseClient
        .from('salary_entries')
        .select(`
          id,
          salary_amount,
          salary_period_end,
          employee_name,
          employee_department,
          notes,
          created_at
        `)
        .gte('salary_period_end', today.toISOString().split('T')[0])
        .lte('salary_period_end', thirtyDaysLater.toISOString().split('T')[0])
        .order('salary_period_end', { ascending: true })
        .limit(10)

      console.log('salary_entriesクエリ結果:', { salaryData, salaryError })

      // エラーチェック
      if (costError && salaryError) {
        console.error('両方のテーブルでエラーが発生:', { costError, salaryError })
        setPaymentData([
          {
            id: 'error-1',
            vendor: `データ取得エラー: 原価・給与両方でエラー`,
            amount: 0,
            dueDate: today.toISOString().split('T')[0],
            type: 'エラー',
            priority: 1,
            negotiable: false,
          }
        ])
        return
      }

      // データを統合
      const paymentData: PaymentData[] = []

      // cost_entriesのデータを変換
      if (costEntries && !costError) {
        costEntries.forEach((entry: {
          id: string
          company_name: string | null
          entry_type: string
          entry_date: string
          amount: number
        }) => {
          const vendor = entry.company_name || '未設定'

          let type = 'その他'
          if (entry.entry_type === 'salary_allocation') {
            type = '人件費'
          } else if (entry.entry_type === 'material') {
            type = '材料費'
          } else if (entry.entry_type === 'outsourcing') {
            type = '委託費'
          } else if (entry.entry_type === 'overhead') {
            type = '経費'
          }

          const dueDate = new Date(entry.entry_date)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          let priority = 5
          if (daysUntilDue <= 3) priority = 10
          else if (daysUntilDue <= 7) priority = 8
          else if (daysUntilDue <= 14) priority = 6

          const negotiable = entry.amount > 500000 && type !== '人件費'

          paymentData.push({
            id: `cost-${entry.id}`,
            vendor: vendor,
            amount: entry.amount,
            dueDate: entry.entry_date,
            type,
            priority,
            negotiable
          })
        })
      }

      // salary_entriesのデータを変換
      if (salaryData && !salaryError) {
        salaryData.forEach((entry: {
          id: string
          salary_amount: number
          salary_period_end: string
          employee_name: string
          employee_department: string | null
        }) => {
          const dueDate = new Date(entry.salary_period_end)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          let priority = 5
          if (daysUntilDue <= 3) priority = 10
          else if (daysUntilDue <= 7) priority = 8
          else if (daysUntilDue <= 14) priority = 6

          paymentData.push({
            id: `salary-${entry.id}`,
            vendor: `${entry.employee_name} (${entry.employee_department || '部署不明'})`,
            amount: entry.salary_amount,
            dueDate: entry.salary_period_end,
            type: '人件費',
            priority,
            negotiable: false, // 人件費は交渉不可
          })
        })
      }

      // データを期日順にソート
      paymentData.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

      console.log('統合された支払いデータ:', { paymentData, count: paymentData.length })

      if (paymentData.length > 0) {
        setPaymentData(paymentData)
      } else {
        // データがない場合は適切なメッセージを表示
        setPaymentData([
          {
            id: 'no-data',
            vendor: '今後の支払い予定はありません',
            amount: 0,
            dueDate: thirtyDaysLater.toISOString().split('T')[0],
            type: '情報',
            priority: 1,
            negotiable: false,
          }
        ])
      }
    } catch (error) {
      console.error('支払いデータ取得エラー:', error)
      setPaymentData([
        {
          id: 'error-1',
          vendor: 'データ取得エラー',
          amount: 0,
          dueDate: new Date().toISOString().split('T')[0],
          type: 'エラー',
          priority: 1,
          negotiable: false,
        }
      ])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    // APIから受け取った日付文字列が「YYYY年M月」形式の場合はそのまま返す
    if (date.includes('年') && date.includes('月')) {
      return date
    }
    // 従来の日付形式の場合は従来通り処理
    return new Date(date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return 'text-red-600 bg-red-100'
    if (priority >= 7) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 9) return '高'
    if (priority >= 7) return '中'
    return '低'
  }

  const totalOutflow = paymentData.reduce((sum, payment) => sum + payment.amount, 0)
  const highPriorityPayments = paymentData.filter(p => p.priority >= 8)
  const negotiableAmount = paymentData.filter(p => p.negotiable).reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              資金管理
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              キャッシュフロー予測と支払い管理を行います
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">AI分析対応</span>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 現在の残高 */}
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
                    {(() => {
                      // 現在の残高を計算
                      let currentBalance = 0
                      
                      if (bankBalanceHistory && bankBalanceHistory.length > 0) {
                        // 管理者パネルの銀行残高履歴管理から最新の月末残高を取得
                        const latestBalance = bankBalanceHistory[0]
                        currentBalance = latestBalance.closing_balance || 0
                        console.log(`💰 CashFlowDashboard: 銀行残高履歴から現在の残高を取得: ${currentBalance} (${latestBalance.balance_date})`)
                      } else if (fiscalInfo) {
                        // 銀行残高履歴がない場合は決算情報の銀行残高を使用
                        currentBalance = fiscalInfo.bank_balance || 0
                        console.log(`💰 CashFlowDashboard: 決算情報から現在の残高を取得: ${currentBalance}`)
                      }
                      
                      return formatCurrency(currentBalance)
                    })()}
                  </dd>
                  {bankBalanceHistory && bankBalanceHistory.length > 0 ? (
                    <dd className="text-xs text-gray-500 mt-1">
                      {new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日現在
                    </dd>
                  ) : fiscalInfo && (
                    <dd className="text-xs text-gray-500 mt-1">
                      {new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日現在
                    </dd>
                  )}
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
                    今月支払い予定
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(totalOutflow)}
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
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    高優先度支払い
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {highPriorityPayments.length}件
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
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    交渉可能金額
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(negotiableAmount)}
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
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    AI予測信頼度
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    87%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* キャッシュフロー予測グラフ */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            キャッシュフロー予測（年度開始月から12ヶ月）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  if (typeof date === 'string') {
                    if (date.includes('年') && date.includes('月')) {
                      const m = date.match(/(\d+)月/)
                      const month = m ? parseInt(m[1], 10) : NaN
                      return Number.isFinite(month) ? `${month}月` : date
                    }
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
                  name === 'inflow' ? '入金' : name === 'outflow' ? '支出' : '残高'
                ]}
                labelFormatter={(date) => `日付: ${formatDate(date)}`}
              />
              <Line dataKey="inflow" stroke="#10B981" name="inflow" strokeWidth={2} />
              <Line dataKey="outflow" stroke="#EF4444" name="outflow" strokeWidth={2} />
              <Line dataKey="balance" stroke="#3B82F6" name="balance" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI予測・警告 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            AI分析・予測
          </h3>
          <div className="space-y-4">
            {aiResult ? (
              <>
                {/* 資金ショートリスク / 全体評価 */}
                <div className={`flex items-start space-x-3 p-3 rounded-lg ${aiResult.overallAssessment.riskLevel === 'high' ? 'bg-red-50' : aiResult.overallAssessment.riskLevel === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${aiResult.overallAssessment.riskLevel === 'high' ? 'text-red-400' : aiResult.overallAssessment.riskLevel === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${aiResult.overallAssessment.riskLevel === 'high' ? 'text-red-800' : aiResult.overallAssessment.riskLevel === 'medium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                      リスク評価（信頼度: {(aiResult.overallAssessment.confidence * 100).toFixed(0)}%）
                    </p>
                    <p className={`text-sm ${aiResult.overallAssessment.riskLevel === 'high' ? 'text-red-700' : aiResult.overallAssessment.riskLevel === 'medium' ? 'text-yellow-700' : 'text-blue-700'}`}>
                      {aiResult.overallAssessment.summary}
                    </p>
                  </div>
                </div>

                {/* 支払い最適化提案 / キーアクション or リスク対策 */}
                {(aiResult.overallAssessment.keyActions.length > 0 || aiResult.riskAnalysis.highRiskPeriods.recommendations.length > 0) && (
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">支払い最適化提案</p>
                      <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                        {(aiResult.overallAssessment.keyActions.length > 0 ? aiResult.overallAssessment.keyActions : aiResult.riskAnalysis.highRiskPeriods.recommendations).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 収入予測 / 成長機会 */}
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">収入・成長機会</p>
                    <p className="text-sm text-blue-700">
                      {aiResult.growthOpportunities.highGrowthMonths.length > 0
                        ? `高成長月: ${aiResult.growthOpportunities.highGrowthMonths.join(', ')}`
                        : '高成長月は検出されていません。'}
                    </p>
                    {aiResult.growthOpportunities.recommendations.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                        {aiResult.growthOpportunities.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* フォールバック（読み込み中/未実行） */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Brain className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">AI分析を準備中</p>
                    <p className="text-sm text-gray-600">予測データを取得後に自動で分析結果を表示します。</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 支払いスケジュール */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">支払いスケジュール</h3>
              <p className="mt-1 text-sm text-gray-500">
                今後の支払い予定と優先度を確認できます
              </p>
            </div>
            <div className="text-right">
              {/* 自動更新を無効化したため、更新時刻表示を削除 */}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支払い先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支払い期日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  優先度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  交渉可否
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentData.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.vendor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(payment.dueDate).toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(payment.priority)}`}>
                      {getPriorityLabel(payment.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.negotiable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.negotiable ? '可能' : '不可'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI強化資金分析 */}
      <AIEnhancedCashFlow />
    </div>
  )
}
