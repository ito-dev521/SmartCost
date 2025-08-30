import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// ドーナツグラフの中心にテキストを表示するプラグイン
const createCenterTextPlugin = (projectInfo: {
  name: string
  businessNumber: string
} | null) => {
  return {
    id: 'centerText',
    afterDraw(chart: {
      ctx: CanvasRenderingContext2D
      chartArea: {
        left: number
        right: number
        top: number
        bottom: number
        width: number
        height: number
      } | null
    }) {
      const { ctx, chartArea } = chart
      
      if (!chartArea) return
      
      const { left, top, width, height } = chartArea
      const centerX = left + width / 2
      const centerY = top + height / 2

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (projectInfo) {
        // プロジェクト名を表示
        ctx.font = 'bold 16px Arial'
        ctx.fillStyle = '#374151'
        ctx.fillText(projectInfo.name, centerX, centerY - 20)

        // 業務番号を表示
        ctx.font = '14px Arial'
        ctx.fillStyle = '#6B7280'
        ctx.fillText(projectInfo.businessNumber, centerX, centerY + 5)

        // 3行目は削除（表示しない）
      } else {
        // 全体分析の場合
        ctx.font = 'bold 16px Arial'
        ctx.fillStyle = '#374151'
        ctx.fillText('全体分析', centerX, centerY - 20)

        ctx.font = '14px Arial'
        ctx.fillStyle = '#6B7280'
        ctx.fillText('カテゴリ別', centerX, centerY + 5)

        // 3行目は削除（表示しない）
      }

      ctx.restore()
    }
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface CategoryCostChartProps {
  categoryData: Array<{
    category: {
      id: string
      name: string
    }
    total: number
    count: number
  }>
  costEntries?: Array<{
    id: string
    project_id: string | null
    category_id: string
    company_name: string | null
    entry_date: string
    amount: number
    description: string | null
    entry_type: string
    created_at: string
    project?: {
      name: string
      business_number: string
    }
  }>
  selectedProject?: string
}

interface CategoryDetailModalProps {
  category: {
    id: string
    name: string
  }
  total: number
  count: number
  onClose: () => void
  categoryEntries?: Array<{
    id: string
    project_id: string | null
    category_id: string
    company_name: string | null
    entry_date: string
    amount: number
    description: string | null
    entry_type: string
    created_at: string
    project?: {
      name: string
      business_number: string
    }
  }>
  selectedProject?: string
  projects?: Array<{
    id: string
    name: string
  }>
}

// カテゴリ詳細モーダルコンポーネント
const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ 
  category, 
  total, 
  count, 
  onClose,
  categoryEntries,
  selectedProject,
  projects
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            カテゴリ詳細: {category.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">基本情報</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-600">カテゴリ名:</span>
                  <span className="text-sm font-medium text-blue-900">{category.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700 mb-2">原価情報</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">総原価:</span>
                  <span className="text-sm font-medium text-green-900">
                    {total.toLocaleString('ja-JP')}円
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">エントリ数:</span>
                  <span className="text-sm font-medium text-green-900">{count}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">平均単価:</span>
                  <span className="text-sm font-medium text-green-900">
                    {count > 0 ? Math.round(total / count).toLocaleString('ja-JP') : 0}円
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-700 mb-2">統計情報</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-600">総原価:</span>
                  <span className="text-sm font-medium text-purple-900">
                    {total.toLocaleString('ja-JP')}円
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-600">エントリ数:</span>
                  <span className="text-sm font-medium text-purple-900">{count}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-600">平均単価:</span>
                  <span className="text-sm font-medium text-purple-900">
                    {count > 0 ? Math.round(total / count).toLocaleString('ja-JP') : 0}円
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 原価分析チャート */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">原価分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {total.toLocaleString('ja-JP')}
                  </div>
                  <div className="text-sm text-gray-600">総原価（円）</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {count}
                  </div>
                  <div className="text-sm text-gray-600">エントリ数（件）</div>
                </div>
              </div>
            </div>
          </div>

          {/* カテゴリ説明 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">カテゴリ説明</h4>
            <p className="text-sm text-gray-600">
              このカテゴリは原価管理における重要な分類項目です。詳細な分析により、
              経営判断や予算管理に活用できます。
            </p>
          </div>

          {/* 内訳一覧 */}
          {categoryEntries && categoryEntries.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  {selectedProject && selectedProject !== 'all' && projects
                    ? `内訳一覧 (${projects.find(p => p.id === selectedProject)?.name || '不明なプロジェクト'})`
                    : '内訳一覧'
                  }
                </h4>
                <span className="text-sm text-gray-500">({categoryEntries.length}件)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                      {(!selectedProject || selectedProject === 'all') && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">プロジェクト</th>
                      )}
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">会社名</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryEntries
                      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(entry.entry_date).toLocaleDateString('ja-JP')}
                          </td>
                          {(!selectedProject || selectedProject === 'all') && (
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {entry.project?.name || '-'}
                            </td>
                          )}
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {entry.company_name || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {entry.description || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {Math.round(entry.amount).toLocaleString('ja-JP')}円
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CategoryCostChart: React.FC<CategoryCostChartProps> = ({ categoryData, costEntries, selectedProject }) => {
  const [selectedCategory, setSelectedCategory] = useState<{
    category: {
      id: string
      name: string
    }
    total: number
    count: number
  } | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  
  // データの準備
  const labels = categoryData.map(item => item.category.name)
  const data = categoryData.map(item => item.total)
  const counts = categoryData.map(item => item.count)

  // プロジェクト情報を取得
  const getProjectInfo = () => {
    if (selectedProject && selectedProject !== 'all' && costEntries) {
      const projectEntry = costEntries.find(entry => entry.project_id === selectedProject)
      if (projectEntry?.project) {
        return {
          name: projectEntry.project.name,
          businessNumber: projectEntry.project.business_number
        }
      }
    }
    return null
  }

  const projectInfo = getProjectInfo()

  // 色の配列
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#EC4899', // pink
    '#6B7280', // gray
  ]

  // 円グラフ（ドーナツ）のデータ
  const doughnutData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  // 棒グラフのデータ
  const barData = {
    labels,
    datasets: [
      {
        label: '原価（円）',
        data,
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length),
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'エントリ数',
        data: counts,
        backgroundColor: colors.slice(0, data.length).map(color => `${color}80`),
        borderColor: colors.slice(0, data.length),
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y1',
      },
    ],
  }

  // 棒グラフのオプション
  const barOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'カテゴリ別原価分析',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: {
            dataset: {
              label: string
            }
            label: string
            parsed: {
              y: number
            }
          }) {
            if (context.dataset.label === '原価（円）') {
              return `${context.label}: ${Math.round(context.parsed.y).toLocaleString('ja-JP')}円`
            } else {
              return `${context.label}: ${context.parsed.y}件`
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '原価（円）',
        },
        ticks: {
          callback: function(value: number) {
            return value.toLocaleString('ja-JP') + '円'
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'エントリ数',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  // 円グラフのオプション
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'カテゴリ別原価割合',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: {
            dataset: {
              data: number[]
            }
            label: string
            parsed: number
          }) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${Math.round(context.parsed).toLocaleString('ja-JP') + '円'} (${percentage}%)`
          }
        }
      }
    }
  }

  // プラグインを登録
  useEffect(() => {
    const centerTextPlugin = createCenterTextPlugin(projectInfo)
    ChartJS.register(centerTextPlugin)
    
    return () => {
      // クリーンアップ時にプラグインを削除
      ChartJS.unregister(centerTextPlugin)
    }
  }, [projectInfo])

  // 合計金額を計算
  const totalAmount = data.reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="space-y-6">
      {/* 概要統計 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {categoryData.length}
            </div>
            <div className="text-sm text-blue-700">カテゴリ数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(totalAmount).toLocaleString('ja-JP')}円
            </div>
            <div className="text-sm text-blue-700">総原価</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {counts.reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-blue-700">総エントリ数</div>
          </div>
        </div>
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 棒グラフ */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <Bar data={barData} options={barOptions} />
        </div>

        {/* 円グラフ */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別詳細</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原価
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  割合
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エントリ数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均単価
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((item, index) => (
                <tr 
                  key={item.category.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(item)
                    setShowCategoryModal(true)
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <div className="text-sm font-medium text-gray-900">
                        {item.category.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {Math.round(item.total).toLocaleString('ja-JP')}円
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.count}件
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.count > 0 ? Math.round(item.total / item.count).toLocaleString('ja-JP') : 0}円
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* カテゴリ詳細モーダルをレンダリング */}
      {showCategoryModal && selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory.category}
          total={selectedCategory.total}
          count={selectedCategory.count}
          categoryEntries={costEntries?.filter(entry => {
            const categoryMatch = entry.category_id === selectedCategory.category.id
            if (selectedProject && selectedProject !== 'all') {
              return categoryMatch && entry.project_id === selectedProject
            }
            return categoryMatch
          })}
          selectedProject={selectedProject}
          projects={costEntries?.reduce((acc: {
            id: string | null
            name: string
          }[], entry) => {
            if (entry.project && !acc.find(p => p.id === entry.project_id)) {
              acc.push({ id: entry.project_id, name: entry.project.name })
            }
            return acc
          }, [])}
          onClose={() => {
            setShowCategoryModal(false)
            setSelectedCategory(null)
          }}
        />
      )}
    </div>
  )
}

export default CategoryCostChart
