'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { Plus, Save, Calendar, Calculator, FileText, Building, Briefcase } from 'lucide-react'

type Project = Tables<'projects'>
type BudgetCategory = Tables<'budget_categories'>
type CostEntry = Tables<'cost_entries'>

export default function CostEntryForm() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProject, setSavingProject] = useState(false)
  const [savingGeneral, setSavingGeneral] = useState(false)
  
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

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      console.log('🔍 データ取得開始...')
      
      // プロジェクト一覧を取得（RLSをバイパスするオプションを試行）
      console.log('📋 プロジェクト取得中...')
      
      // まず通常の方法で取得を試行
      let { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name')

      console.log('📋 通常のプロジェクト取得結果:', { projectsData, projectsError })

      // エラーが発生した場合、RLSの問題の可能性があるため、別のアプローチを試行
      if (projectsError || !projectsData || projectsData.length === 0) {
        console.log('⚠️ 通常の取得でエラーまたはデータなし、RLSバイパスを試行...')
        
        // 全プロジェクトを取得してみる（RLSポリシーの問題を特定）
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('*')
        
        console.log('📊 全プロジェクト取得結果:', { allProjects, allProjectsError })
        
        // 特定の会社IDで取得してみる
        if (allProjects && allProjects.length > 0) {
          const firstProject = allProjects[0]
          console.log('🔍 最初のプロジェクトの会社ID:', firstProject.company_id)
          
          const { data: companyProjects, error: companyProjectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('company_id', firstProject.company_id)
            .eq('status', 'active')
          
          console.log('🏢 特定会社のプロジェクト取得結果:', { companyProjects, companyProjectsError })
          
          if (companyProjects && companyProjects.length > 0) {
            projectsData = companyProjects
            projectsError = null
          }
        }
      }

      if (projectsError) {
        console.error('❌ プロジェクト取得エラー:', projectsError)
        throw projectsError
      }

      // 予算科目一覧を取得
      console.log('🏷️ カテゴリ取得中...')
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('budget_categories')
        .select('*')
        .order('level, sort_order')

      console.log('🏷️ カテゴリ取得結果:', { categoriesData, categoriesError })

      if (categoriesError) {
        console.error('❌ カテゴリ取得エラー:', categoriesError)
        throw categoriesError
      }

      // 最近の原価エントリーを取得
      console.log('💰 原価エントリー取得中...')
      const { data: entriesData, error: entriesError } = await supabase
        .from('cost_entries')
        .select(`
          *,
          projects:project_id(name),
          budget_categories:category_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('💰 原価エントリー取得結果:', { entriesData, entriesError })

      if (entriesError) {
        console.error('❌ 原価エントリー取得エラー:', entriesError)
        throw entriesError
      }

      // プロジェクトデータを設定
      if (projectsData && projectsData.length > 0) {
        console.log('✅ プロジェクトデータ設定:', projectsData.length, '件')
        console.log('📋 プロジェクト詳細:', projectsData.map(p => ({ id: p.id, name: p.name, company_id: p.company_id, status: p.status })))
        setProjects(projectsData)
      } else {
        console.log('⚠️ データベースにアクティブなプロジェクトが見つかりません')
        console.log('📊 プロジェクトテーブルの全データを確認中...')
        
        // プロジェクトテーブルの全データを確認
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('*')
        
        if (allProjectsError) {
          console.error('❌ 全プロジェクト取得エラー:', allProjectsError)
        } else {
          console.log('📊 プロジェクトテーブルの全データ:', allProjects)
          if (allProjects && allProjects.length > 0) {
            console.log('📋 各プロジェクトの詳細:')
            allProjects.forEach((project, index) => {
              console.log(`  ${index + 1}. ID: ${project.id}, 名前: ${project.name}, 会社ID: ${project.company_id}, ステータス: ${project.status}`)
            })
          }
        }
        
        setProjects([])
      }

      // カテゴリデータを設定
      if (categoriesData && categoriesData.length > 0) {
        console.log('✅ カテゴリデータ設定:', categoriesData.length, '件')
        setCategories(categoriesData)
      } else {
        // データベースにカテゴリがない場合のフォールバック
        console.log('⚠️ データベースに予算カテゴリが見つかりません、フォールバックデータを使用')
        setCategories([
          // プロジェクト原価関連
          { id: '1', name: 'プロジェクト直接費', parent_id: null, level: 1, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'プロジェクト間接費', parent_id: null, level: 1, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
          { id: '3', name: '人件費', parent_id: '1', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '4', name: '外注費', parent_id: '1', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
          { id: '5', name: '材料費', parent_id: '1', level: 2, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
          { id: '6', name: '機械費', parent_id: '1', level: 2, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
          { id: '7', name: '現場管理費', parent_id: '2', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          
          // 一般管理費関連
          { id: '8', name: '一般管理費', parent_id: null, level: 1, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
          { id: '9', name: '開発費', parent_id: '8', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
          { id: '10', name: '一般事務給与', parent_id: '8', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
          { id: '11', name: 'オフィス経費', parent_id: '8', level: 2, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
          { id: '12', name: '通信費', parent_id: '8', level: 2, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
          { id: '13', name: '光熱費', parent_id: '8', level: 2, sort_order: 5, created_at: '2024-01-01T00:00:00Z' },
          { id: '14', name: 'その他経費', parent_id: '8', level: 2, sort_order: 6, created_at: '2024-01-01T00:00:00Z' },
        ])
      }

      setCostEntries(entriesData || [])
      console.log('✅ データ取得完了')
    } catch (error) {
      console.error('❌ データ取得エラー:', error)
      // エラーが発生した場合でも、フォールバックデータを設定
      setProjects([])
      setCategories([
        // プロジェクト原価関連
        { id: '1', name: 'プロジェクト直接費', parent_id: null, level: 1, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'プロジェクト間接費', parent_id: null, level: 1, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
        { id: '3', name: '人件費', parent_id: '1', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: '4', name: '外注費', parent_id: '1', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
        { id: '5', name: '材料費', parent_id: '1', level: 2, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
        { id: '6', name: '機械費', parent_id: '1', level: 2, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
        { id: '7', name: '現場管理費', parent_id: '2', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
        
        // 一般管理費関連
        { id: '8', name: '一般管理費', parent_id: null, level: 1, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
        { id: '9', name: '開発費', parent_id: '8', level: 2, sort_order: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: '10', name: '一般事務給与', parent_id: '8', level: 2, sort_order: 2, created_at: '2024-01-01T00:00:00Z' },
        { id: '11', name: 'オフィス経費', parent_id: '8', level: 2, sort_order: 3, created_at: '2024-01-01T00:00:00Z' },
        { id: '12', name: '通信費', parent_id: '8', level: 2, sort_order: 4, created_at: '2024-01-01T00:00:00Z' },
        { id: '13', name: '光熱費', parent_id: '8', level: 2, sort_order: 5, created_at: '2024-01-01T00:00:00Z' },
        { id: '14', name: 'その他経費', parent_id: '8', level: 2, sort_order: 6, created_at: '2024-01-01T00:00:00Z' },
      ])
      setCostEntries([])
    } finally {
      setLoading(false)
    }
  }

  // プロジェクト原価の保存処理
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProject(true)

    try {
      const entryData = {
        project_id: projectFormData.project_id,
        category_id: projectFormData.category_id,
        entry_date: projectFormData.entry_date,
        amount: parseFloat(projectFormData.amount),
        description: projectFormData.description || null,
        entry_type: projectFormData.entry_type,
        created_by: 'user-1', // TODO: 実際のユーザーIDを取得
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('cost_entries')
        .insert([entryData])

      if (error) throw error

      // フォームをリセット
      setProjectFormData({
        project_id: '',
        category_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        entry_type: 'direct',
      })

      // 最近のエントリーを再取得
      fetchInitialData()

      alert('プロジェクト原価データを保存しました')
    } catch (error) {
      console.error('Error saving project cost entry:', error)
      alert('プロジェクト原価データの保存に失敗しました')
    } finally {
      setSavingProject(false)
    }
  }

  // 一般管理費の保存処理
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeneral(true)

    try {
      const entryData = {
        project_id: null, // 一般管理費はプロジェクトに紐づかない
        category_id: generalFormData.category_id,
        company_name: generalFormData.company_name || null, // 会社名を追加
        entry_date: generalFormData.entry_date,
        amount: parseFloat(generalFormData.amount),
        description: generalFormData.description || null,
        entry_type: generalFormData.entry_type,
        created_by: 'user-1', // TODO: 実際のユーザーIDを取得
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('cost_entries')
        .insert([entryData])

      if (error) throw error

      // フォームをリセット
      setGeneralFormData({
        category_id: '',
        company_name: '',
        entry_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        entry_type: 'general_admin',
      })

      // 最近のエントリーを再取得
      fetchInitialData()

      alert('一般管理費データを保存しました')
    } catch (error) {
      console.error('Error saving general admin cost entry:', error)
      alert('一般管理費データの保存に失敗しました')
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
    if (!projectId) return '一般管理費'
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '不明'
  }

  // プロジェクト原価用のカテゴリを取得
  const getProjectCategories = () => {
    return categories.filter(c => c.parent_id === '1' || c.parent_id === '2' || c.id === '1' || c.id === '2')
  }

  // 一般管理費用のカテゴリを取得
  const getGeneralCategories = () => {
    return categories.filter(c => c.parent_id === '8' || c.id === '8')
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
          プロジェクト原価および一般管理費を入力してください
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* プロジェクト原価入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">プロジェクト原価入力</h2>
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">プロジェクトを選択してください</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
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
                  type="number"
                  name="amount"
                  id="project_amount"
                  required
                  min="0"
                  step="1"
                  value={projectFormData.amount}
                  onChange={handleProjectChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000000"
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
                {savingProject ? '保存中...' : 'プロジェクト原価を保存'}
              </button>
            </div>
          </form>
        </div>

        {/* 一般管理費入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Building className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">一般管理費入力</h2>
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
                  type="number"
                  name="amount"
                  id="general_amount"
                  required
                  min="0"
                  step="1"
                  value={generalFormData.amount}
                  onChange={handleGeneralChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  placeholder="1000000"
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
                {savingGeneral ? '保存中...' : '一般管理費を保存'}
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
            costEntries.map((entry) => (
              <div key={entry.id} className={`border-l-4 pl-4 py-2 ${
                entry.project_id ? 'border-blue-400' : 'border-orange-400'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
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
                上記のフォームから原価データを入力してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






