'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  Building,
  Users,
  ChevronDown,
  ChevronUp
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
}

interface CostEntry {
  id: string
  project_id: string | null
  category_id: string
  company_name: string | null
  entry_date: string
  amount: number
  description: string | null
  entry_type: string
  created_at: string
}

interface BudgetCategory {
  id: string
  name: string
  level: number
  parent_id: string | null
}

export default function AnalyticsDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState('month')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'total-performance']))

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // プロジェクトデータを取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      // 原価エントリーデータを取得
      const { data: costEntriesData } = await supabase
        .from('cost_entries')
        .select('*')
        .order('entry_date', { ascending: false })

      // 予算科目データを取得
      const { data: categoriesData } = await supabase
        .from('budget_categories')
        .select('*')
        .order('level, sort_order')

      if (projectsData) setProjects(projectsData)
      if (costEntriesData) setCostEntries(costEntriesData)
      if (categoriesData) setCategories(categoriesData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされたデータを取得
  const getFilteredData = () => {
    let filtered = costEntries

    // 日付範囲でフィルタリング
    if (selectedDateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (selectedDateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(entry => new Date(entry.entry_date) >= startDate)
    }

    // プロジェクトでフィルタリング
    if (selectedProject !== 'all') {
      filtered = filtered.filter(entry => entry.project_id === selectedProject)
    }

    // カテゴリでフィルタリング
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category_id === selectedCategory)
    }

    return filtered
  }

  // 統計データを計算
  const calculateStats = () => {
    const filteredData = getFilteredData()

    const totalCost = filteredData.reduce((sum, entry) => sum + entry.amount, 0)
    const projectCosts = filteredData.filter(entry => entry.project_id)
    const generalCosts = filteredData.filter(entry => !entry.project_id)

    const projectCostTotal = projectCosts.reduce((sum, entry) => sum + entry.amount, 0)
    const generalCostTotal = generalCosts.reduce((sum, entry) => sum + entry.amount, 0)

    // 契約金額合計を計算
    const totalContractAmount = projects
      .filter(project => project.contract_amount)
      .reduce((sum, project) => sum + (project.contract_amount || 0), 0)

    // 総利益を計算（契約金額 - プロジェクト原価）
    const totalProfit = totalContractAmount - projectCostTotal
    const totalProfitMargin = totalContractAmount > 0 ? (totalProfit / totalContractAmount) * 100 : 0

    return {
      totalCost,
      projectCostTotal,
      generalCostTotal,
      totalContractAmount,
      totalProfit,
      totalProfitMargin,
      entryCount: filteredData.length,
      projectCount: new Set(projectCosts.map(entry => entry.project_id)).size
    }
  }

  // プロジェクト別原価集計
  const getProjectCostBreakdown = () => {
    const filteredData = getFilteredData().filter(entry => entry.project_id)

    const breakdown = projects.map(project => {
      const projectCosts = filteredData.filter(entry => entry.project_id === project.id)
      const total = projectCosts.reduce((sum, entry) => sum + entry.amount, 0)

      // 契約金額との比較
      const contractAmount = project.contract_amount || 0
      const profit = contractAmount - total
      const profitMargin = contractAmount > 0 ? (profit / contractAmount) * 100 : 0

      return {
        project,
        total,
        count: projectCosts.length,
        costs: projectCosts,
        contractAmount,
        profit,
        profitMargin
      }
    }).filter(item => item.total > 0 || item.contractAmount > 0)

    return breakdown.sort((a, b) => {
      // 契約金額がある場合は利益率でソート、ない場合は原価でソート
      if (a.contractAmount > 0 && b.contractAmount > 0) {
        return b.profitMargin - a.profitMargin
      } else if (a.contractAmount > 0) {
        return -1
      } else if (b.contractAmount > 0) {
        return 1
      } else {
        return b.total - a.total
      }
    })
  }

  // カテゴリ別原価集計
  const getCategoryCostBreakdown = () => {
    const filteredData = getFilteredData()
    
    const breakdown = categories.map(category => {
      const categoryCosts = filteredData.filter(entry => entry.category_id === category.id)
      const total = categoryCosts.reduce((sum, entry) => sum + entry.amount, 0)
      
      return {
        category,
        total,
        count: categoryCosts.length
      }
    }).filter(item => item.total > 0)
    
    return breakdown.sort((a, b) => b.total - a.total)
  }

  // 月別原価推移
  const getMonthlyCostTrend = () => {
    const filteredData = getFilteredData()
    
    const monthlyData: { [key: string]: number } = {}
    
    filteredData.forEach(entry => {
      const month = entry.entry_date.substring(0, 7) // YYYY-MM形式
      monthlyData[month] = (monthlyData[month] || 0) + entry.amount
    })
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }))
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
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

  const stats = calculateStats()
  const projectBreakdown = getProjectCostBreakdown()
  const categoryBreakdown = getCategoryCostBreakdown()
  const monthlyTrend = getMonthlyCostTrend()

  return (
    <div className="space-y-6">
      {/* フィルターセクション */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">フィルター設定</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 日付範囲 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日付範囲
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全期間</option>
              <option value="week">過去1週間</option>
              <option value="month">過去1ヶ月</option>
              <option value="quarter">過去3ヶ月</option>
              <option value="year">過去1年</option>
            </select>
          </div>

          {/* プロジェクト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全プロジェクト</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.business_number} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原価科目
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全科目</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* リセットボタン */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedDateRange('all')
                setSelectedProject('all')
                setSelectedCategory('all')
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              フィルターリセット
            </button>
          </div>
        </div>
      </div>

      {/* 概要統計 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <h3 className="text-lg font-semibold">概要統計</h3>
          {expandedSections.has('overview') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('overview') && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCost)}</div>
              <div className="text-sm text-gray-600">総原価</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.projectCostTotal)}</div>
              <div className="text-sm text-gray-600">プロジェクト原価</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.generalCostTotal)}</div>
              <div className="text-sm text-gray-600">その他経費</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalContractAmount)}</div>
              <div className="text-sm text-gray-600">総契約金額</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.totalProfit)}</div>
              <div className="text-sm text-gray-600">総利益</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{stats.totalProfitMargin.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">平均利益率</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{stats.entryCount}</div>
              <div className="text-sm text-gray-600">エントリ数</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{stats.projectCount}</div>
              <div className="text-sm text-gray-600">対象プロジェクト数</div>
            </div>
          </div>
        )}
      </div>

      {/* プロジェクト別原価分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('project-analysis')}
        >
          <h3 className="text-lg font-semibold">プロジェクト別収益性分析</h3>
          {expandedSections.has('project-analysis') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('project-analysis') && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロジェクト
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業務番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      契約金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      原価合計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利益
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利益率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      エントリ数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBreakdown.map((item) => (
                    <tr key={item.project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.project.name}
                        {item.project.client_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.project.client_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.project.business_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          item.project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                          item.project.status === 'on_hold' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.project.status === 'completed' ? '完了' :
                           item.project.status === 'in_progress' ? '進行中' :
                           item.project.status === 'planning' ? '計画中' :
                           item.project.status === 'on_hold' ? '保留中' : '中止'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? formatCurrency(item.contractAmount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? (
                          <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.profit)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? (
                          <span className={item.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* カテゴリ別原価分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('category-analysis')}
        >
          <h3 className="text-lg font-semibold">カテゴリ別原価分析</h3>
          {expandedSections.has('category-analysis') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('category-analysis') && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* テーブル表示 */}
              <div>
                <h4 className="text-md font-medium mb-3">詳細一覧</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          カテゴリ
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          件数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryBreakdown.map((item) => (
                        <tr key={item.category.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.category.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 円グラフ表示（プレースホルダー） */}
              <div>
                <h4 className="text-md font-medium mb-3">構成比</h4>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">円グラフ実装予定</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 月別原価推移 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('monthly-trend')}
        >
          <h3 className="text-lg font-semibold">月別原価推移</h3>
          {expandedSections.has('monthly-trend') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('monthly-trend') && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* テーブル表示 */}
              <div>
                <h4 className="text-md font-medium mb-3">月別データ</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          年月
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          原価合計
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyTrend.map((item) => (
                        <tr key={item.month} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.month}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* グラフ表示（プレースホルダー） */}
              <div>
                <h4 className="text-md font-medium mb-3">推移グラフ</h4>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">折れ線グラフ実装予定</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 総合成績分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('total-performance')}
        >
          <h3 className="text-lg font-semibold">総合成績分析</h3>
          {expandedSections.has('total-performance') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {expandedSections.has('total-performance') && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 総合成績サマリー */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">総合成績サマリー</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総契約金額:</span>
                    <span className="text-sm font-medium text-blue-900">{formatCurrency(stats.totalContractAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総原価:</span>
                    <span className="text-sm font-medium text-blue-900">{formatCurrency(stats.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総利益:</span>
                    <span className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">平均利益率:</span>
                    <span className={`text-sm font-medium ${stats.totalProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 原価構成比 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4">原価構成比</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">プロジェクト原価:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.totalCost > 0 ? ((stats.projectCostTotal / stats.totalCost) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">その他経費:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.totalCost > 0 ? ((stats.generalCostTotal / stats.totalCost) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">プロジェクト数:</span>
                    <span className="text-sm font-medium text-green-900">{stats.projectCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">平均原価/プロジェクト:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.projectCount > 0 ? formatCurrency(stats.projectCostTotal / stats.projectCount) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 収益性指標 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">収益性指標</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">粗利益:</span>
                    <span className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">粗利益率:</span>
                    <span className={`text-sm font-medium ${stats.totalProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">契約金額対原価比:</span>
                    <span className="text-sm font-medium text-purple-900">
                      {stats.projectCostTotal > 0 ? (stats.totalContractAmount / stats.projectCostTotal).toFixed(2) : 0}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">平均契約金額:</span>
                    <span className="text-sm font-medium text-purple-900">
                      {projects.filter(p => p.contract_amount).length > 0
                        ? formatCurrency(stats.totalContractAmount / projects.filter(p => p.contract_amount).length)
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* プロジェクト分析サマリー */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-900 mb-4">プロジェクト分析</h4>
                <div className="space-y-3">
                  {(() => {
                    const breakdown = getProjectCostBreakdown()
                    const profitableProjects = breakdown.filter(item => item.profit > 0)
                    const lossProjects = breakdown.filter(item => item.profit < 0)

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">黒字プロジェクト:</span>
                          <span className="text-sm font-medium text-green-600">{profitableProjects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">赤字プロジェクト:</span>
                          <span className="text-sm font-medium text-red-600">{lossProjects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">最高利益率:</span>
                          <span className="text-sm font-medium text-green-600">
                            {profitableProjects.length > 0 ? Math.max(...profitableProjects.map(p => p.profitMargin)).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">最低利益率:</span>
                          <span className="text-sm font-medium text-red-600">
                            {lossProjects.length > 0 ? Math.min(...lossProjects.map(p => p.profitMargin)).toFixed(1) : 0}%
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* エクスポート機能 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">レポートエクスポート</h3>
        </div>
        
        <div className="mt-4 space-y-6">
          {/* レポートタイプ選択 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">レポートタイプ</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="comprehensive"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">包括的分析レポート</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="profitability"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">収益性分析レポート</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">サマリーレポート</span>
              </label>
            </div>
          </div>

          {/* エクスポート形式 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">エクスポート形式</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">CSV形式</div>
                  <div className="text-xs opacity-90">契約金額・利益率を含む詳細データ</div>
                </div>
              </button>
              <button className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Excel形式</div>
                  <div className="text-xs opacity-90">グラフ・チャート付き</div>
                </div>
              </button>
              <button className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">PDF形式</div>
                  <div className="text-xs opacity-90">印刷用レポート</div>
                </div>
              </button>
            </div>
          </div>

          {/* 追加オプション */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">追加オプション</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">契約金額・利益率を含む</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">プロジェクト別詳細分析</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">月別推移データ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">カテゴリ別分析</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
