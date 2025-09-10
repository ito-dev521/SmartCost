'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Target,
  AlertCircle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  business_number: string
  status: string
  contract_amount: number | null
  start_date: string | null
  end_date: string | null
  client_name: string | null
  company_id: string
}

interface ProgressData {
  id: string
  project_id: string
  progress_rate: number
  progress_date: string
  notes: string | null
  created_at: string
  company_id: string
}

interface CostEntry {
  id: string
  project_id: string | null
  category_id: string
  entry_date: string
  amount: number
  description: string | null
  entry_type: string
  created_at: string
  company_id: string
}

interface BudgetCategory {
  id: string
  name: string
  level: number
  parent_id: string | null
  company_id: string
}

interface ProgressCostAnalysisData {
  project: Project
  latestProgress: ProgressData | null
  totalCost: number
  costByCategory: { [categoryId: string]: { name: string; amount: number } }
  contractAmount: number
  recognizedRevenue: number
  profit: number
  profitMargin: number
  costEfficiency: number
}

export default function ProgressCostAnalysis() {
  const [data, setData] = useState<ProgressCostAnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current')

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 ProgressCostAnalysis: データ取得開始')

      // APIからデータを取得
      const response = await fetch('/api/analytics/progress-cost', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      console.log('📡 ProgressCostAnalysis: APIレスポンス:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ ProgressCostAnalysis: API取得成功')

      if (!result.success) {
        throw new Error(result.error || 'データの取得に失敗しました')
      }

      const analysisData: ProgressCostAnalysisData[] = result.data

      // フィルタリング
      let filteredData = analysisData

      if (selectedProject !== 'all') {
        filteredData = filteredData.filter(item => item.project.id === selectedProject)
      }

      if (selectedPeriod === 'completed') {
        filteredData = filteredData.filter(item => item.project.status === 'completed')
      } else if (selectedPeriod === 'in_progress') {
        filteredData = filteredData.filter(item => item.project.status === 'in_progress')
      }

      console.log('📊 ProgressCostAnalysis: フィルタリング後データ数:', filteredData.length)
      setData(filteredData)

    } catch (err) {
      console.error('❌ ProgressCostAnalysis: データ取得エラー:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedProject, selectedPeriod])

  // 統計データの計算
  const getStatistics = () => {
    if (data.length === 0) return null

    const totalProjects = data.length
    const totalContractAmount = data.reduce((sum, item) => sum + item.contractAmount, 0)
    const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0)
    const totalRecognizedRevenue = data.reduce((sum, item) => sum + item.recognizedRevenue, 0)
    const totalProfit = data.reduce((sum, item) => sum + item.profit, 0)
    const averageProgress = data.reduce((sum, item) => sum + (item.latestProgress?.progress_rate || 0), 0) / totalProjects
    const averageProfitMargin = data.reduce((sum, item) => sum + item.profitMargin, 0) / totalProjects

    return {
      totalProjects,
      totalContractAmount,
      totalCost,
      totalRecognizedRevenue,
      totalProfit,
      averageProgress,
      averageProfitMargin
    }
  }

  const statistics = getStatistics()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">工事進行基準原価分析</h2>
            <p className="text-sm text-gray-600">進捗率に基づく収益認識と原価管理の分析</p>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">プロジェクト:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              {data.map(item => (
                <option key={item.project.id} value={item.project.id}>
                  {item.project.business_number} - {item.project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">期間:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">すべて</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">プロジェクト数</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">認識済み収益</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{Math.round(statistics.totalRecognizedRevenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総原価</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{Math.round(statistics.totalCost).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${statistics.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`h-5 w-5 ${statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総利益</p>
                <p className={`text-2xl font-bold ${statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{Math.round(statistics.totalProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プロジェクト別詳細分析 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">プロジェクト別詳細分析</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プロジェクト
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  進捗率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  契約金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  認識済み収益
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  実績原価
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利益
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利益率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原価効率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.project.business_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.project.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.latestProgress?.progress_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {item.latestProgress?.progress_rate || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{Math.round(item.contractAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{Math.round(item.recognizedRevenue).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{Math.round(item.totalCost).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ¥{Math.round(item.profit).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${item.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{Math.round(item.costEfficiency).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* データが空の場合 */}
      {data.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">分析データがありません</p>
        </div>
      )}
    </div>
  )
}
