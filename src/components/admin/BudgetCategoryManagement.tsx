'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight,
  Folder,
  FileText,
  AlertCircle
} from 'lucide-react'

type BudgetCategory = Tables<'budget_categories'>

interface BudgetCategoryFormData {
  name: string
  level: number
  parent_id: string | null
  sort_order: number | null
}

export default function BudgetCategoryManagement() {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState<BudgetCategoryFormData>({
    name: '',
    level: 1,
    parent_id: null,
    sort_order: null
  })

  const supabase = createClientComponentClient()

  // データ取得
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      // 現在のユーザーの会社IDを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData) {
        throw new Error('会社情報の取得に失敗しました')
      }

      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('level, sort_order, name')

      if (error) throw error

      setCategories(data || [])
    } catch (err) {
      console.error('原価科目取得エラー:', err)
      setError(err instanceof Error ? err.message : '原価科目の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 階層構造の構築
  const buildHierarchy = (categories: BudgetCategory[]) => {
    const categoryMap = new Map<string, BudgetCategory & { children: BudgetCategory[] }>()
    const rootCategories: (BudgetCategory & { children: BudgetCategory[] })[] = []

    // 全カテゴリをマップに追加（全てにchildrenプロパティを追加）
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // 親子関係を構築
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!
        parent.children.push(categoryWithChildren)
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  // 親カテゴリの選択肢を取得
  const getParentOptions = (excludeId?: string) => {
    return categories.filter(cat => 
      cat.level < 3 && // 最大3階層まで
      cat.id !== excludeId
    )
  }

  // 次のソート順を取得
  const getNextSortOrder = (level: number, parentId: string | null) => {
    const siblings = categories.filter(cat => 
      cat.level === level && cat.parent_id === parentId
    )
    return siblings.length + 1
  }

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      level: 1,
      parent_id: null,
      sort_order: null
    })
    setIsAdding(false)
    setEditingId(null)
  }

  // 追加開始
  const startAdding = (parentId?: string, level?: number) => {
    const newLevel = level ? level + 1 : 1
    const newParentId = parentId || null
    
    setFormData({
      name: '',
      level: newLevel,
      parent_id: newParentId,
      sort_order: getNextSortOrder(newLevel, newParentId)
    })
    setIsAdding(true)
    setEditingId(null)
  }

  // 編集開始
  const startEditing = (category: BudgetCategory) => {
    setFormData({
      name: category.name,
      level: category.level,
      parent_id: category.parent_id,
      sort_order: category.sort_order
    })
    setEditingId(category.id)
    setIsAdding(false)
  }

  // 保存処理
  const handleSave = async () => {
    console.log('💾 保存処理開始:', formData)
    
    if (!formData.name.trim()) {
      alert('原価科目名を入力してください')
      return
    }

    try {
      console.log('🔐 ユーザー認証確認中...')
      // 現在のユーザーの会社IDを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('❌ ユーザー認証エラー:', userError)
        throw new Error('ユーザー情報の取得に失敗しました')
      }
      console.log('✅ ユーザー認証成功:', user.id)

      console.log('🏢 会社情報取得中...')
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData) {
        console.error('❌ 会社情報取得エラー:', userDataError)
        throw new Error('会社情報の取得に失敗しました')
      }
      console.log('✅ 会社情報取得成功:', userData.company_id)

      if (editingId) {
        // 更新
        console.log('📝 更新処理開始:', { editingId, formData })
        const { error } = await supabase
          .from('budget_categories')
          .update({
            name: formData.name.trim(),
            level: formData.level,
            parent_id: formData.parent_id,
            sort_order: formData.sort_order
          })
          .eq('id', editingId)
          .eq('company_id', userData.company_id)

        if (error) {
          console.error('❌ 更新エラー:', error)
          throw error
        }
        console.log('✅ 更新成功')
        alert('原価科目を更新しました')
      } else {
        // 新規作成
        console.log('➕ 新規作成処理開始:', { formData, company_id: userData.company_id })
        const { error } = await supabase
          .from('budget_categories')
          .insert([{
            name: formData.name.trim(),
            level: formData.level,
            parent_id: formData.parent_id,
            sort_order: formData.sort_order,
            company_id: userData.company_id
          }])

        if (error) {
          console.error('❌ 新規作成エラー:', error)
          throw error
        }
        console.log('✅ 新規作成成功')
        alert('原価科目を追加しました')
      }

      resetForm()
      await fetchCategories()
    } catch (err) {
      console.error('保存エラー:', err)
      console.error('エラー詳細:', {
        error: err,
        formData,
        editingId
      })
      
      let errorMessage = '保存に失敗しました'
      if (err instanceof Error) {
        errorMessage = err.message
        // より詳細なエラーメッセージを提供
        if (err.message.includes('duplicate key')) {
          errorMessage = '同じ名前の原価科目が既に存在します'
        } else if (err.message.includes('foreign key')) {
          errorMessage = '選択した親カテゴリが無効です'
        } else if (err.message.includes('not null')) {
          errorMessage = '必須項目が入力されていません'
        }
      }
      
      alert(`保存エラー: ${errorMessage}`)
    }
  }

  // 削除処理
  const handleDelete = async (category: BudgetCategory) => {
    // 子カテゴリがあるかチェック
    const hasChildren = categories.some(cat => cat.parent_id === category.id)
    if (hasChildren) {
      alert('子カテゴリが存在するため削除できません。先に子カテゴリを削除してください。')
      return
    }

    // 使用中かチェック（cost_entriesで使用されているか）
    const { data: usageData } = await supabase
      .from('cost_entries')
      .select('id')
      .eq('category_id', category.id)
      .limit(1)

    if (usageData && usageData.length > 0) {
      alert('この原価科目は使用中のため削除できません。')
      return
    }

    if (!confirm(`「${category.name}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      // 現在のユーザーの会社IDを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData) {
        throw new Error('会社情報の取得に失敗しました')
      }

      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', category.id)
        .eq('company_id', userData.company_id)

      if (error) throw error

      alert('原価科目を削除しました')
      await fetchCategories()
    } catch (err) {
      console.error('削除エラー:', err)
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  // 階層の展開/折りたたみ
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // 階層表示用のコンポーネント
  const CategoryItem = ({
    category,
    depth = 0
  }: {
    category: BudgetCategory & { children?: BudgetCategory[] }
    depth?: number
  }) => {
    const isExpanded = expandedCategories.has(category.id)
    const isEditing = editingId === category.id
    const hasChildren = (category.children?.length ?? 0) > 0

    return (
      <div className="border-l border-gray-200 ml-4">
        <div className={`flex items-center justify-between p-3 hover:bg-gray-50 ${
          depth === 0 ? 'bg-white border border-gray-200 rounded-lg mb-2' : ''
        }`}>
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div className="flex items-center">
              {hasChildren ? (
                <Folder className="h-4 w-4 text-blue-500 mr-2" />
              ) : (
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {category.name}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                (レベル {category.level})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startAdding(category.id, category.level)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="子カテゴリを追加"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => startEditing(category)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children?.map(child => (
              <CategoryItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">原価科目を読み込み中...</p>
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

  const hierarchy = buildHierarchy(categories)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">原価科目管理</h3>
          <p className="text-sm text-gray-600">原価科目の追加・編集・削除を行います</p>
        </div>
        <button
          onClick={() => startAdding()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          原価科目を追加
        </button>
      </div>

      {/* フォーム */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingId ? '原価科目を編集' : '原価科目を追加'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原価科目名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 人件費"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                レベル
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  level: parseInt(e.target.value),
                  parent_id: parseInt(e.target.value) === 1 ? null : prev.parent_id
                }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1 (大分類)</option>
                <option value={2}>2 (中分類)</option>
                <option value={3}>3 (小分類)</option>
              </select>
            </div>

            {formData.level > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  親カテゴリ
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    parent_id: e.target.value || null 
                  }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">親カテゴリを選択</option>
                  {getParentOptions(editingId || undefined).map(category => (
                    <option key={category.id} value={category.id}>
                      {'　'.repeat(category.level - 1)}{category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                並び順
              </label>
              <input
                type="number"
                min="1"
                value={formData.sort_order || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sort_order: e.target.value === '' ? null : parseInt(e.target.value) || null
                }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2 inline" />
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              保存
            </button>
          </div>
        </div>
      )}

      {/* 原価科目一覧 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">原価科目一覧</h4>
        </div>
        
        <div className="p-4">
          {hierarchy.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">原価科目が登録されていません</p>
              <p className="text-sm text-gray-400 mt-1">「原価科目を追加」ボタンから追加してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchy.map(category => (
                <CategoryItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

