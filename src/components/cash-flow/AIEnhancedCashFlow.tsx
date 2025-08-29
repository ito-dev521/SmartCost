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
  transaction_count: number
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

  // 分析・レポートと同じ計算ロジック
  const calculateMonthlyRevenue = (
    projects: Project[],
    clients: Client[],
    caddonBillings: CaddonBilling[],
    fiscalInfo: any
  ): MonthlyData[] => {
    const fiscalYearStart = fiscalInfo.settlement_month + 1
    const monthlyRevenue: MonthlyData[] = []

    // 一般管理費を除外したプロジェクトを取得
    const filteredProjects = projects.filter(project =>
      !project.name.includes('一般管理費') &&
      !project.name.includes('その他経費')
    )

    filteredProjects.forEach(project => {
      const client = clients.find(c => c.name === project.client_name)

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

  const calculateMonthlyCost = (
    costEntries: CostEntry[],
    projects: Project[]
  ): MonthlyData[] => {
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

  useEffect(() => {
    initializeData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeData = async () => {
    await Promise.all([
      fetchFiscalInfo(),
      fetchBankBalanceHistory(),
      fetchDetailedPredictions()
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

  const fetchDetailedPredictions = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const response = await fetch(`/api/cash-flow-prediction?fiscal_year=${currentYear}&months=12`)
      if (response.ok) {
        const data = await response.json()
        setDetailedPredictions(data.predictions || [])
        setPredictionSummary(data.summary)
      }
    } catch (error) {
      console.error('詳細予測取得エラー:', error)
    }
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

      const currentBalance = fiscalInfo?.bank_balance || 0

      // 分析・レポートと同じ計算ロジックを使用
      const monthlyRevenue = calculateMonthlyRevenue(
        projects || [],
        clients || [],
        caddonBillings || [],
        fiscalInfo || { settlement_month: 3 }
      )

      const monthlyCost = calculateMonthlyCost(
        costEntries || [],
        projects || []
      )

      // 月間収入・支出の平均を計算
      const totalIncome = monthlyRevenue.reduce((sum, r) => sum + r.amount, 0)
      const totalExpense = monthlyCost.reduce((sum, c) => sum + c.amount, 0)
      const averageMonthlyIncome = monthlyRevenue.length > 0 ? totalIncome / monthlyRevenue.length : 0
      const averageMonthlyExpense = monthlyCost.length > 0 ? totalExpense / monthlyCost.length : 0

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
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-gray-50'
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
                              信頼度: {prediction.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>推奨アクション:</strong> {prediction.recommended_action}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>予測残高: {formatCurrency(prediction.predicted_balance)}</span>
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
                    日付
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引件数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.slice(0, 10).map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.balance_date).toLocaleDateString('ja-JP')}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.transaction_count}件
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
          {/* 予測サマリー */}
          {predictionSummary && (
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
                          {formatCurrency(predictionSummary.total_predicted_inflow)}
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
                          {formatCurrency(predictionSummary.total_predicted_outflow)}
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
                          {formatCurrency(predictionSummary.net_cash_flow)}
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
                          {predictionSummary.high_risk_months}ヶ月
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 詳細予測グラフ */}
          {detailedPredictions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                キャッシュフロー詳細予測（決算月の翌月から）
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
                        const d = new Date(date)
                        return `${d.getMonth() + 1}月`
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
                      labelFormatter={(date) => `日付: ${new Date(date).toLocaleDateString('ja-JP')}`}
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
                          {new Date(prediction.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
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
          {/* リスク警告と推奨事項 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              リスク分析と対策
            </h3>
            <div className="space-y-4">
              {/* 高リスク期間の警告 */}
              {detailedPredictions.some(p => p.risk_level === 'high') && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">高リスク期間の検知</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {detailedPredictions.filter(p => p.risk_level === 'high').length}ヶ月間において、
                        資金ショートのリスクが高い期間が予測されています。
                      </p>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-800">推奨対策:</p>
                        <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                          <li>緊急の資金調達を検討（銀行融資、投資家からの資金調達）</li>
                          <li>支出削減策の実施（不要な経費の削減、人員配置の見直し）</li>
                          <li>収入増加策の検討（新規プロジェクトの獲得、価格改定）</li>
                          <li>現金予備の確保（3ヶ月分の運転資金を確保）</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 季節性リスクの警告 */}
              {(() => {
                const seasonalRiskMonths = detailedPredictions.filter(p => {
                  const month = new Date(p.date).getMonth() + 1
                  return (month >= 11 || month <= 2) && p.predicted_outflow > p.predicted_inflow * 1.1
                })
                return seasonalRiskMonths.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">季節性リスクの検知</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          年末年始または年度末期において、支出が収入を上回る傾向が予測されています。
                        </p>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-yellow-800">季節性対策:</p>
                          <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                            <li>季節変動に備えた資金準備（年間資金計画の策定）</li>
                            <li>年末年始の支出抑制（ボーナス支給、賞与の計画的な支出）</li>
                            <li>早期の収入確保（期末前の請求書発行、早期入金依頼）</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 成長機会の提案 */}
              {detailedPredictions.some(p => p.predicted_balance > 0 && p.risk_level === 'low') && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">成長機会の検知</h4>
                      <p className="text-sm text-green-700 mt-1">
                        安定したキャッシュフローが見込まれる期間があります。積極的な事業拡大を検討できます。
                      </p>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-green-800">成長戦略:</p>
                        <ul className="text-xs text-green-700 mt-1 list-disc list-inside">
                          <li>新規プロジェクトの積極的な受注活動</li>
                          <li>設備投資や人材採用の検討</li>
                          <li>市場拡大のための営業投資</li>
                          <li>財務体質強化のための内部留保の積み立て</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
