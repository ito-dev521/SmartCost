'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AlertTriangle,
  Building2,
  Calculator,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalBudget: number
  totalCost: number
  budgetVariance: number
  profitMargin: number
}

interface ProjectData {
  name: string
  budget: number
  actual: number
  variance: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    totalCost: 0,
    budgetVariance: 0,
    profitMargin: 0,
  })
  const [projectData, setProjectData] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // プロジェクト統計の取得
      const { data: projects } = await supabase
        .from('projects')
        .select('*')

      // 予算データの取得
      const { data: budgets } = await supabase
        .from('project_budgets')
        .select('*')

      // 原価データの取得
      const { data: costs } = await supabase
        .from('cost_entries')
        .select('*')

      // サンプルデータ（実際のデータがない場合）
      if (!projects?.length) {
        setStats({
          totalProjects: 12,
          activeProjects: 8,
          totalBudget: 150000000,
          totalCost: 135000000,
          budgetVariance: -10.0,
          profitMargin: 12.5,
        })

        setProjectData([
          { name: '道路設計業務A', budget: 25000000, actual: 23500000, variance: -6.0 },
          { name: '橋梁点検業務B', budget: 18000000, actual: 19200000, variance: 6.7 },
          { name: '河川改修設計C', budget: 32000000, actual: 30800000, variance: -3.8 },
          { name: '都市計画業務D', budget: 22000000, actual: 24100000, variance: 9.5 },
          { name: '環境調査業務E', budget: 15000000, actual: 14200000, variance: -5.3 },
        ])
      } else {
        // 実際のデータから統計を計算
        const totalProjects = projects.length
        const activeProjects = projects.filter(p => p.status === 'active').length
        const totalBudget = budgets?.reduce((sum, b) => sum + (b.planned_amount || 0), 0) || 0
        const totalCost = costs?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        const budgetVariance = totalBudget > 0 ? ((totalCost - totalBudget) / totalBudget) * 100 : 0
        const profitMargin = totalBudget > 0 ? ((totalBudget - totalCost) / totalBudget) * 100 : 0

        setStats({
          totalProjects,
          activeProjects,
          totalBudget,
          totalCost,
          budgetVariance,
          profitMargin,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">
          プロジェクトの概要とAI分析結果をご確認いただけます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* 総プロジェクト数 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総プロジェクト数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalProjects}件
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 進行中プロジェクト */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    進行中プロジェクト
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeProjects}件
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 総予算額 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総予算額
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalBudget)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 総原価額 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総原価額
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalCost)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 予算差異 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {stats.budgetVariance >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-red-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-400" />
                )}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    予算差異
                  </dt>
                  <dd className={`text-lg font-medium ${
                    stats.budgetVariance >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stats.budgetVariance > 0 ? '+' : ''}{stats.budgetVariance.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 利益率 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    利益率
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {stats.profitMargin.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* プロジェクト予算vs実績 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            プロジェクト別 予算vs実績
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `プロジェクト: ${label}`}
              />
              <Bar dataKey="budget" fill="#3B82F6" name="予算" />
              <Bar dataKey="actual" fill="#10B981" name="実績" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI警告・推奨事項 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            AI分析・警告
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  予算オーバーリスク
                </p>
                <p className="text-sm text-yellow-700">
                  橋梁点検業務Bで予算オーバーのリスクが検出されました。
                  早期の対策をお勧めします。
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  資金フロー予測
                </p>
                <p className="text-sm text-blue-700">
                  来月の資金アウトフローは約2,800万円と予測されます。
                  資金調達の検討をお勧めします。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  効率化提案
                </p>
                <p className="text-sm text-green-700">
                  類似プロジェクトのデータから、人員配置の最適化により
                  コストを5%削減できる可能性があります。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">最近の活動</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              action: '原価入力',
              project: '道路設計業務A',
              amount: 1200000,
              time: '2時間前',
            },
            {
              action: '予算更新',
              project: '橋梁点検業務B',
              amount: 800000,
              time: '4時間前',
            },
            {
              action: '進捗更新',
              project: '河川改修設計C',
              amount: null,
              time: '6時間前',
            },
          ].map((activity, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action} - {activity.project}
                  </p>
                  {activity.amount && (
                    <p className="text-sm text-gray-500">
                      {formatCurrency(activity.amount)}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
