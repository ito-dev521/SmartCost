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
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCashFlowData()
    fetchFiscalInfo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCashFlowData = async () => {
    try {
      // Supabaseクライアントを作成
      const supabase = createClientComponentClient()

      // APIからキャッシュフロー予測データを取得
      const response = await fetch('/api/cash-flow-prediction')
      if (!response.ok) {
        throw new Error('Failed to fetch cash flow data')
      }
      const predictionData = await response.json()

      if (predictionData.predictions && predictionData.predictions.length > 0) {
        // APIの予測データをチャート用データに変換
        const chartData: CashFlowData[] = predictionData.predictions.map((p: any) => ({ 
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
        console.log('キャッシュフロー予測開始月計算:', { fiscalInfo, settlementMonth: fiscalInfo?.settlement_month })
        const fiscalStartMonth = fiscalInfo ? fiscalInfo.settlement_month : 3 // デフォルトは3月決算
        const startDate = new Date(currentYear, fiscalStartMonth, 1) // 決算月の翌月を開始月とする
        console.log('計算結果:', {
          fiscalStartMonth,
          startDate: startDate.toISOString().split('T')[0],
          startMonth: startDate.getMonth() + 1
        })
        const initialBalance = 5000000

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
      // エラー時はサンプルデータを表示
      const fallbackData: CashFlowData[] = []
      const currentYear = new Date().getFullYear()
      const startDate = new Date(currentYear, 3, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate)
        date.setMonth(startDate.getMonth() + i)
        
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          inflow: 15000000,
          outflow: 12000000,
          balance: 3000000,
        })
      }
      setCashFlowData(fallbackData)
    } finally {
      setLoading(false)
    }
  }
  const fetchFiscalInfo = async () => {
    try {
      console.log('fetchFiscalInfo開始')
      const response = await fetch('/api/fiscal-info')
      console.log('APIレスポンス:', response.status, response.ok)

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

  // 支払いデータをデータベースから取得
  const fetchPaymentData = async (supabaseClient: any) => {
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
      const { data: simpleData, error: simpleError } = await supabaseClient
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
          // salary_entriesデータをPaymentData形式に変換
          const paymentData: PaymentData[] = salaryData.map((entry: any) => {
            const dueDate = new Date(entry.payment_date)
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

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
              negotiable: false, // 人件費は交渉不可
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
        costEntries.forEach((entry: any) => {
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
        salaryData.forEach((entry: any) => {
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

      {/* AI強化資金分析 */}
      <AIEnhancedCashFlow />
    </div>
  )
}
