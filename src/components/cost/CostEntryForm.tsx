'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { Plus, Save, Calendar, Calculator, FileText, Building, Briefcase, Edit, X, Trash2, ChevronDown } from 'lucide-react'

type Project = Tables<'projects'>
type BudgetCategory = Tables<'budget_categories'>
type CostEntry = Tables<'cost_entries'>

interface CostEntryFormProps {
  initialProjects: Project[]
  initialCategories: BudgetCategory[]
  initialCostEntries: CostEntry[]
}

export default function CostEntryForm({ 
  initialProjects, 
  initialCategories, 
  initialCostEntries 
}: CostEntryFormProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories)
  const [costEntries, setCostEntries] = useState<CostEntry[]>(initialCostEntries)
  const [loading, setLoading] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  
  // プロジェクト原価用のフォームデータ
  const [projectFormData, setProjectFormData] = useState({
    project_id: '',
    category_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    entry_type: 'direct',
  })

  // 一般管理費用のフォームデータ
  const [generalFormData, setGeneralFormData] = useState({
    category_id: '',
    company_name: '',
    entry_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    entry_type: 'general_admin',
  })

  const supabase = createClientComponentClient()

  // 現在のユーザーIDを取得
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'unknown'
  }

  // 編集モードを開始
  const startEditing = (entry: CostEntry) => {
    setEditingEntry(entry)
    setIsEditing(true)
    
    if (entry.project_id) {
      // プロジェクト原価の場合
      setProjectFormData({
        project_id: entry.project_id,
        category_id: entry.category_id,
        entry_date: entry.entry_date,
        amount: entry.amount.toString(),
        description: entry.description || '',
        entry_type: entry.entry_type as 'direct' | 'indirect',
      })
    } else {
      // 一般管理費の場合
      setGeneralFormData({
        category_id: entry.category_id,
        company_name: (entry as any).company_name || '',
        entry_date: entry.entry_date,
        amount: entry.amount.toString(),
        description: entry.description || '',
        entry_type: 'general_admin',
      })
    }
  }

  // 編集モードをキャンセル
  const cancelEditing = () => {
    setEditingEntry(null)
    setIsEditing(false)
    // フォームをリセット
    setProjectFormData({
      project_id: '',
      category_id: '',
      entry_date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      entry_type: 'direct',
    })
    setGeneralFormData({
      category_id: '',
      company_name: '',
      entry_date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      entry_type: 'general_admin',
    })
  }

  // 削除機能
  const handleDelete = async (entry: CostEntry) => {
    if (!confirm('この原価エントリーを削除してもよろしいですか？')) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('cost_entries')
        .delete()
        .eq('id', entry.id)

      if (error) {
        console.error('削除エラー:', error)
        alert('原価エントリーの削除に失敗しました')
        return
      }

      // ローカルステートから削除
      setCostEntries(prev => prev.filter(e => e.id !== entry.id))
      alert('原価エントリーを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('原価エントリーの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // データの再取得（保存後の更新用）
  const refreshData = async () => {
    try {
      setLoading(true)
      
      // プロジェクトデータを再取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      // 予算科目データを再取得
      const { data: categoriesData } = await supabase
        .from('budget_categories')
        .select('*')
        .order('level, sort_order')

      // 最近の原価エントリーを再取得（全件取得してフロントエンドで制御）
      const { data: entriesData } = await supabase
        .from('cost_entries')
        .select(`
          *,
          projects:project_id(name),
          budget_categories:category_id(name)
        `)
        .order('created_at', { ascending: false })

      if (projectsData) setProjects(projectsData)
      if (categoriesData) setCategories(categoriesData)
      if (entriesData) {
        setCostEntries(entriesData)
        // 新しいデータが読み込まれたら、表示状態をリセット
        setShowAllEntries(false)
      }
    } catch (error) {
      console.error('データ再取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // プロジェクト原価の保存処理
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!projectFormData.project_id || !projectFormData.category_id || !projectFormData.amount) {
      alert('必須項目を入力してください')
      return
    }
    
    if (parseFloat(projectFormData.amount) <= 0) {
      alert('金額は0より大きい値を入力してください')
      return
    }
    
    setSavingProject(true)

    try {
      const currentUserId = await getCurrentUserId()
      
      if (isEditing && editingEntry) {
        // 編集モード：既存エントリーを更新
        const { error } = await supabase
          .from('cost_entries')
          .update({
            project_id: projectFormData.project_id,
            category_id: projectFormData.category_id,
            entry_date: projectFormData.entry_date,
            amount: parseFloat(projectFormData.amount),
            description: projectFormData.description || null,
            entry_type: projectFormData.entry_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEntry.id)

        if (error) throw error

        alert('プロジェクト原価データを更新しました')
        cancelEditing()
      } else {
        // 新規作成モード
        const entryData = {
          project_id: projectFormData.project_id,
          category_id: projectFormData.category_id,
          entry_date: projectFormData.entry_date,
          amount: parseFloat(projectFormData.amount),
          description: projectFormData.description || null,
          entry_type: projectFormData.entry_type,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('cost_entries')
          .insert([entryData])

        if (error) throw error

        alert('プロジェクト原価データを保存しました')
      }

      // データを再取得
      await refreshData()
    } catch (error) {
      console.error('Error saving project cost entry:', error)
      alert(isEditing ? 'プロジェクト原価データの更新に失敗しました' : 'プロジェクト原価データの保存に失敗しました')
    } finally {
      setSavingProject(false)
    }
  }

  // その他経費の保存処理
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!generalFormData.category_id || !generalFormData.amount) {
      alert('必須項目を入力してください')
      return
    }
    
    if (parseFloat(generalFormData.amount) <= 0) {
      alert('金額は0より大きい値を入力してください')
      return
    }
    
    setSavingGeneral(true)

    try {
      const currentUserId = await getCurrentUserId()
      
      if (isEditing && editingEntry) {
        // 編集モード：既存エントリーを更新
        const { error } = await supabase
          .from('cost_entries')
          .update({
            category_id: generalFormData.category_id,
            company_name: generalFormData.company_name || null,
            entry_date: generalFormData.entry_date,
            amount: parseFloat(generalFormData.amount),
            description: generalFormData.description || null,
            entry_type: generalFormData.entry_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEntry.id)

        if (error) throw error

        alert('その他経費データを更新しました')
        cancelEditing()
      } else {
        // 新規作成モード
        const entryData = {
          project_id: null, // その他経費はプロジェクトに紐づかない
          category_id: generalFormData.category_id,
          company_name: generalFormData.company_name || null,
          entry_date: generalFormData.entry_date,
          amount: parseFloat(generalFormData.amount),
          description: generalFormData.description || null,
          entry_type: generalFormData.entry_type,
          created_by: currentUserId,
          created_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('cost_entries')
          .insert([entryData])

        if (error) throw error

        alert('その他経費データを保存しました')
      }

      // データを再取得
      await refreshData()
    } catch (error) {
      console.error('Error saving general admin cost entry:', error)
      alert(isEditing ? 'その他経費データの更新に失敗しました' : 'その他経費データの保存に失敗しました')
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGeneralFormData(prev => ({ ...prev, [name]: value }))
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
    if (!projectId) return 'その他経費'
    const project = projects.find(p => p.id === projectId)
    if (!project) return '不明'
    
    // 業務番号がある場合は「業務番号 - プロジェクト名」の形式で表示
    return project.business_number 
      ? `${project.business_number} - ${project.name}`
      : project.name
  }

  // プロジェクト原価用のカテゴリを取得
  const getProjectCategories = () => {
    return categories.filter(c => 
      // 指定された4つの原価のみを含める
      c.name.includes('人件費') ||
      c.name.includes('委託費') ||
      c.name.includes('外注費') ||
      c.name.includes('材料費')
    )
  }

  // その他経費用のカテゴリを取得
  const getGeneralCategories = () => {
    return categories.filter(c =>
      // 一般管理費、開発費、間接費を含める
      c.name.includes('一般管理費') ||
      c.name.includes('開発費') ||
      c.name.includes('間接費')
    )
  }

  // 表示するエントリを取得（10件 or 全て）
  const getDisplayedEntries = () => {
    const entries = showAllEntries ? costEntries : costEntries.slice(0, 10)
    console.log('表示エントリー取得:', {
      showAllEntries,
      totalEntries: costEntries.length,
      displayedCount: entries.length
    })
    return entries
  }

  // 「もっと見る」ボタンを表示するかどうか
  const shouldShowMoreButton = () => {
    const shouldShow = costEntries.length > 10 && !showAllEntries
    console.log('もっと見るボタン表示チェック:', {
      totalEntries: costEntries.length,
      showAllEntries,
      shouldShow
    })
    return shouldShow
  }

  // デバッグ用：プロジェクトデータの詳細を表示
  useEffect(() => {
    console.log('=== プロジェクトデータ詳細 ===')
    projects.forEach((project, index) => {
      console.log(`プロジェクト ${index + 1}:`, {
        id: project.id,
        name: project.name,
        business_number: project.business_number,
        status: project.status,
        hasBusinessNumber: !!project.business_number
      })
    })
    console.log('========================')
  }, [projects])



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
          プロジェクト原価および一般管理費を入力してください
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* プロジェクト原価入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                {isEditing ? 'プロジェクト原価編集' : 'プロジェクト原価入力'}
              </h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </button>
            )}
          </div>

          <form onSubmit={handleProjectSubmit} className="space-y-6">
            {/* プロジェクト選択 */}
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                プロジェクト <span className="text-red-500">*</span>
              </label>
              <select
                name="project_id"
                id="project_id"
                required
                value={projectFormData.project_id}
                onChange={handleProjectChange}
                disabled={isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">プロジェクトを選択してください</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.business_number ? `${project.business_number} - ${project.name}` : project.name}
                  </option>
                ))}
              </select>
              {/* デバッグ情報 */}
              {projects.length === 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>デバッグ情報:</strong> プロジェクトが読み込まれていません
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    データベースの projects テーブルにデータが存在するか確認してください
                  </p>
                  <p className="text-xs text-yellow-700">
                    ブラウザのコンソールで詳細なログを確認できます
                  </p>
                </div>
              )}
              {projects.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {projects.length}件のプロジェクトが読み込まれています
                </p>
              )}
              

            </div>

            {/* 原価科目選択 */}
            <div>
              <label htmlFor="project_category_id" className="block text-sm font-medium text-gray-700">
                原価科目 <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                id="project_category_id"
                required
                value={projectFormData.category_id}
                onChange={handleProjectChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">原価科目を選択してください</option>
                {getProjectCategories().map((category) => (
                  <option key={category.id} value={category.id}>
                    {'　'.repeat(category.level - 1)}{category.name}
                  </option>
                ))}
              </select>
              

            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* 発生日 */}
              <div>
                <label htmlFor="project_entry_date" className="block text-sm font-medium text-gray-700">
                  発生日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="entry_date"
                  id="project_entry_date"
                  required
                  value={projectFormData.entry_date}
                  onChange={handleProjectChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 金額 */}
              <div>
                <label htmlFor="project_amount" className="block text-sm font-medium text-gray-700">
                  金額（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="amount"
                  id="project_amount"
                  required
                  value={projectFormData.amount === '' ? '' : (parseFloat(projectFormData.amount) || 0).toLocaleString()}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[,\s]/g, '')
                    setProjectFormData(prev => ({ ...prev, amount: numericValue }))
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value.replace(/[,\s]/g, '')) || 0
                    if (value > 0) {
                      e.target.value = value.toLocaleString()
                    }
                  }}
                  onFocus={(e) => {
                    const value = parseFloat(e.target.value.replace(/[,\s]/g, '')) || 0
                    if (value > 0) {
                      e.target.value = value.toString()
                    }
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1,000,000"
                />
              </div>
            </div>

            {/* 原価種別 */}
            <div>
              <label htmlFor="project_entry_type" className="block text-sm font-medium text-gray-700">
                原価種別
              </label>
              <select
                name="entry_type"
                id="project_entry_type"
                value={projectFormData.entry_type}
                onChange={handleProjectChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="direct">直接費</option>
                <option value="indirect">間接費</option>
              </select>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="project_description" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                name="description"
                id="project_description"
                rows={3}
                value={projectFormData.description}
                onChange={handleProjectChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="詳細な説明があれば入力してください"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProject}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingProject ? '保存中...' : isEditing ? 'プロジェクト原価を更新' : 'プロジェクト原価を保存'}
              </button>
            </div>
          </form>
        </div>

        {/* その他経費入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                {isEditing ? 'その他経費編集' : 'その他経費入力'}
              </h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </button>
            )}
          </div>

          <form onSubmit={handleGeneralSubmit} className="space-y-6">
            {/* 原価科目選択 */}
            <div>
              <label htmlFor="general_category_id" className="block text-sm font-medium text-gray-700">
                原価科目 <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                id="general_category_id"
                required
                value={generalFormData.category_id}
                onChange={handleGeneralChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">原価科目を選択してください</option>
                {getGeneralCategories().map((category) => (
                  <option key={category.id} value={category.id}>
                    {'　'.repeat(category.level - 1)}{category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 会社名 */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                会社名
              </label>
              <input
                type="text"
                name="company_name"
                id="company_name"
                value={generalFormData.company_name}
                onChange={handleGeneralChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                placeholder="例: 株式会社ABC"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* 発生日 */}
              <div>
                <label htmlFor="general_entry_date" className="block text-sm font-medium text-gray-700">
                  発生日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="entry_date"
                  id="general_entry_date"
                  required
                  value={generalFormData.entry_date}
                  onChange={handleGeneralChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* 金額 */}
              <div>
                <label htmlFor="general_amount" className="block text-sm font-medium text-gray-700">
                  金額（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="amount"
                  id="general_amount"
                  required
                  value={generalFormData.amount === '' ? '' : (parseFloat(generalFormData.amount) || 0).toLocaleString()}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[,\s]/g, '')
                    setGeneralFormData(prev => ({ ...prev, amount: numericValue }))
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value.replace(/[,\s]/g, '')) || 0
                    if (value > 0) {
                      e.target.value = value.toLocaleString()
                    }
                  }}
                  onFocus={(e) => {
                    const value = parseFloat(e.target.value.replace(/[,\s]/g, '')) || 0
                    if (value > 0) {
                      e.target.value = value.toString()
                    }
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="1,000,000"
                />
              </div>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="general_description" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                name="description"
                id="general_description"
                rows={3}
                value={generalFormData.description}
                onChange={handleGeneralChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                placeholder="詳細な説明があれば入力してください"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingGeneral}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingGeneral ? '保存中...' : isEditing ? 'その他経費を更新' : 'その他経費を保存'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 最近の原価エントリー */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">最近の原価エントリー</h2>
        </div>

        <div className="space-y-4">
          {costEntries.length > 0 ? (
            <>
              {getDisplayedEntries().map((entry) => (
              <div key={entry.id} className={`border-l-4 pl-4 py-2 ${
                entry.project_id ? 'border-blue-400' : 'border-orange-400'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getProjectName(entry.project_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getCategoryName(entry.category_id)} - {entry.entry_type === 'direct' ? '直接費' : entry.entry_type === 'indirect' ? '間接費' : '一般管理費'}
                    </p>
                    {/* 一般管理費の場合は会社名を表示 */}
                    {!entry.project_id && (entry as any).company_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        会社: {(entry as any).company_name}
                      </p>
                    )}
                    {entry.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => startEditing(entry)}
                      className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        entry.project_id 
                          ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500' 
                          : 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 focus:ring-orange-500'
                      }`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      disabled={loading}
                      className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      削除
                    </button>
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
              </div>
              ))}

              {/* もっと見るボタン */}
              {shouldShowMoreButton() && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAllEntries(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    もっと見る ({costEntries.length - 10}件)
                  </button>
                </div>
              )}

              {/* 全て表示中の場合のメッセージと閉じるボタン */}
              {showAllEntries && costEntries.length > 10 && (
                <div className="text-center pt-4 space-y-3">
                  <p className="text-sm text-gray-500">
                    全{costEntries.length}件を表示中
                  </p>
                  <button
                    onClick={() => setShowAllEntries(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ChevronDown className="h-4 w-4 mr-2 rotate-180" />
                    閉じる
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                原価エントリーがありません
              </p>
              <p className="text-xs text-gray-400">
                上記のフォームから原価データを入力してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}