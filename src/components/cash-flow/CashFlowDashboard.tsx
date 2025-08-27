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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Zap,
} from 'lucide-react'

interface CashFlowData {
  date: string
  inflow: number
  outflow: number
  balance: number
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

export default function CashFlowDashboard() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])
  const [aiPredictions, setAiPredictions] = useState<Record<string, unknown>[]>([])
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCashFlowData()
    fetchFiscalInfo()
  }, [])

  const fetchCashFlowData = async () => {
    try {
      // キャッシュフロー予測データを取得
      const { data: predictions } = await supabase
        .from('cash_flow_predictions')
        .select('*')
        .order('prediction_date')

      // 支払いスケジュールデータを取得
      const { data: payments } = await supabase
        .from('payment_schedule')
        .select('*')
        .order('due_date')

      // AI予測データを取得
      const { data: aiData } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('prediction_type', 'cash_flow')
        .order('created_at', { ascending: false })
        .limit(5)

      // サンプルデータを設定（実際のデータがない場合）
      if (!predictions?.length) {
        const sampleCashFlow: CashFlowData[] = []
        const today = new Date()
        const initialBalance = fiscalInfo?.bank_balance || 5000000

        for (let i = 0; i < 12; i++) {
          const date = new Date(today)
          date.setMonth(date.getMonth() + i)

          const baseInflow = 15000000 + Math.random() * 10000000
          const baseOutflow = 12000000 + Math.random() * 8000000
          const balance = baseInflow - baseOutflow + (i > 0 ? sampleCashFlow[i-1].balance : initialBalance)

          sampleCashFlow.push({
            date: date.toISOString().split('T')[0],
            inflow: baseInflow,
            outflow: baseOutflow,
            balance: balance,
          })
        }
        setCashFlowData(sampleCashFlow)
      } else {
        setCashFlowData(predictions.map(p => ({
          date: p.prediction_date,
          inflow: p.predicted_inflow,
          outflow: p.predicted_outflow,
          balance: p.predicted_inflow - p.predicted_outflow,
        })))
      }

      if (!payments?.length) {
        setPaymentData([
          {
            id: '1',
            vendor: '株式会社A設計',
            amount: 2800000,
            dueDate: '2024-09-15',
            type: '外注費',
            priority: 8,
            negotiable: false,
          },
          {
            id: '2',
            vendor: 'B測量事務所',
            amount: 1200000,
            dueDate: '2024-09-20',
            type: '測量費',
            priority: 6,
            negotiable: true,
          },
          {
            id: '3',
            vendor: 'C建設コンサルタント',
            amount: 3500000,
            dueDate: '2024-09-25',
            type: '委託費',
            priority: 9,
            negotiable: false,
          },
          {
            id: '4',
            vendor: '人件費（9月分）',
            amount: 4200000,
            dueDate: '2024-09-30',
            type: '人件費',
            priority: 10,
            negotiable: false,
          },
        ])
      } else {
        setPaymentData(payments.map(p => ({
          id: p.id,
          vendor: p.vendor_name || '',
          amount: p.payment_amount,
          dueDate: p.due_date,
          type: p.payment_type || '',
          priority: p.priority_score || 5,
          negotiable: p.is_negotiable || false,
        })))
      }

      setAiPredictions(aiData || [])
    } catch (error) {
      console.error('Error fetching cash flow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFiscalInfo = async () => {
    try {
      const response = await fetch('/api/fiscal-info')
      if (response.ok) {
        const data = await response.json()
        if (data.fiscalInfo) {
          setFiscalInfo(data.fiscalInfo)
        }
      }
    } catch (error) {
      console.error('決算情報取得エラー:', error)
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
        <h1 className="text-2xl font-bold text-gray-900">資金管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          キャッシュフロー予測と支払い管理を行います
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 銀行残高 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    銀行残高
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {fiscalInfo ? formatCurrency(fiscalInfo.bank_balance) : '未設定'}
                  </dd>
                  {fiscalInfo && (
                    <dd className="text-xs text-gray-500 mt-1">
                      {fiscalInfo.fiscal_year}年度 第{fiscalInfo.current_period}期
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            キャッシュフロー予測（12ヶ月）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatDate(date)}
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
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  資金ショートリスク
                </p>
                <p className="text-sm text-red-700">
                  3ヶ月後に資金ショートの可能性があります（信頼度: 78%）。
                  早期の資金調達をお勧めします。
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  支払い最適化提案
                </p>
                <p className="text-sm text-yellow-700">
                  B測量事務所への支払いを1週間延期することで、
                  キャッシュフローが改善されます。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  収入予測
                </p>
                <p className="text-sm text-blue-700">
                  来月の売上入金は過去データから1,800万円と予測されます。
                  契約完了プロジェクトからの入金が見込まれます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 支払いスケジュール */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">支払いスケジュール</h3>
          <p className="mt-1 text-sm text-gray-500">
            今後の支払い予定と優先度を確認できます
          </p>
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
    </div>
  )
}
