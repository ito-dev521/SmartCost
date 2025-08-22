'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { Plus, Save, Calendar, Calculator, FileText } from 'lucide-react'

type Project = Tables<'projects'>
type BudgetCategory = Tables<'budget_categories'>
type CostEntry = Tables<'cost_entries'>

export default function CostEntryForm() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    project_id: '',
    category_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    entry_type: 'direct',
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      // プロジェクト一覧を取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name')

      // 予算科目一覧を取得
      const { data: categoriesData } = await supabase
        .from('budget_categories')
        .select('*')
        .order('level, sort_order')

      // 最近の原価エントリーを取得
      const { data: entriesData } = await supabase
        .from('cost_entries')
        .select(`
          *,
          projects:project_id(name),
          budget_categories:category_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // サンプルデータを設定（実際のデータがない場合）
      if (!projectsData?.length) {
        setProjects([
          {
            id: '1',
            name: '道路設計業務A',
            company_id: 'company-1',
            client_name: '○○市役所',
            contract_amount: 25000000,
            start_date: '2024-01-15',
            end_date: '2024-12-15',
            completion_method: 'percentage',
            progress_calculation_method: 'cost_ratio',
            status: 'active',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          {
            id: '2',
            name: '橋梁点検業務B',
            company_id: 'company-1',
            client_name: '△△県庁',
            contract_amount: 18000000,
            start_date: '2024-02-01',
            end_date: '2024-11-30',
            completion_method: 'percentage',
            progress_calculation_method: 'work_ratio',
            status: 'active',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
          },
        ])
      } else {
        setProjects(projectsData)
      }

      if (!categoriesData?.length) {
        setCategories([
          { id: '1', name: '直接費', parent_id: null, level: 1, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '2', name: '間接費', parent_id: null, level: 1, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
          { id: '3', name: '人件費', parent_id: '1', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '4', name: '外注費', parent_id: '1', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
          { id: '5', name: '材料費', parent_id: '1', level: 2, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
          { id: '6', name: '機械費', parent_id: '1', level: 2, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
          { id: '7', name: '現場管理費', parent_id: '2', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '8', name: '一般管理費', parent_id: '2', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
        ])
      } else {
        setCategories(categoriesData)
      }

      setCostEntries(entriesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const entryData = {
        project_id: formData.project_id,
        category_id: formData.category_id,
        entry_date: formData.entry_date,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        entry_type: formData.entry_type,
        created_by: 'user-1', // TODO: 実際のユーザーIDを取得
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('cost_entries')
        .insert([entryData])

      if (error) throw error

      // フォームをリセット
      setFormData({
        project_id: '',
        category_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        entry_type: 'direct',
      })

      // 最近のエントリーを再取得
      fetchInitialData()

      alert('原価データを保存しました')
    } catch (error) {
      console.error('Error saving cost entry:', error)
      alert('原価データの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : '不明'
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '不明'
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
        <h1 className="text-2xl font-bold text-gray-900">原価入力</h1>
        <p className="mt-1 text-sm text-gray-500">
          プロジェクトの原価データを入力してください
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 原価入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Calculator className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">原価データ入力</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* プロジェクト選択 */}
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                プロジェクト <span className="text-red-500">*</span>
              </label>
              <select
                name="project_id"
                id="project_id"
                required
                value={formData.project_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">プロジェクトを選択してください</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 原価科目選択 */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                原価科目 <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                id="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">原価科目を選択してください</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'　'.repeat(category.level - 1)}{category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* 発生日 */}
              <div>
                <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700">
                  発生日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="entry_date"
                  id="entry_date"
                  required
                  value={formData.entry_date}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 金額 */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  金額（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  min="0"
                  step="1"
                  value={formData.amount}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000000"
                />
              </div>
            </div>

            {/* 原価種別 */}
            <div>
              <label htmlFor="entry_type" className="block text-sm font-medium text-gray-700">
                原価種別
              </label>
              <select
                name="entry_type"
                id="entry_type"
                value={formData.entry_type}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="direct">直接費</option>
                <option value="indirect">間接費</option>
              </select>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細な説明があれば入力してください"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>

        {/* 最近の原価エントリー */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">最近の原価エントリー</h2>
          </div>

          <div className="space-y-4">
            {costEntries.length > 0 ? (
              costEntries.map((entry) => (
                <div key={entry.id} className="border-l-4 border-blue-400 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getProjectName(entry.project_id)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getCategoryName(entry.category_id)} - {entry.entry_type === 'direct' ? '直接費' : '間接費'}
                      </p>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(entry.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.entry_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  原価エントリーがありません
                </p>
                <p className="text-xs text-gray-400">
                  左側のフォームから原価データを入力してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

