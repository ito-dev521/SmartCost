'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Building, Plus, Edit, Trash2, X, Save } from 'lucide-react'

interface Department {
  id: string
  name: string
  company_id?: string
  parent_id?: string
  created_at: string
}

interface DepartmentFormData {
  name: string
  parent_id: string
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null)
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    parent_id: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<DepartmentFormData>>({})

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      
      // 現在のユーザーの会社IDを取得
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', currentUser?.id)
        .single()

      const companyId = userData?.company_id

      if (!companyId) {
        console.error('会社IDが取得できません')
        setDepartments([])
        return
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name')

      if (error) {
        console.error('部署取得エラー:', error)
        throw error
      }

      console.log('部署取得成功:', data?.length || 0, '件')
      setDepartments(data || [])
    } catch (error) {
      console.error('部署取得エラー:', error)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = () => {
    setEditingDepartment(null)
    setFormData({ name: '', parent_id: '' })
    setFormErrors({})
    setShowForm(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      parent_id: department.parent_id || ''
    })
    setFormErrors({})
    setShowForm(true)
  }

  const handleDeleteDepartment = async (department: Department) => {
    try {
      // 子部署があるかチェック
      const hasChildren = departments.some(dept => dept.parent_id === department.id)
      if (hasChildren) {
        alert('子部署が存在する部署は削除できません。先に子部署を削除してください。')
        return
      }

      // 部署を使用しているユーザーがいるかチェック
      const { data: usersUsingDept } = await supabase
        .from('users')
        .select('id, name')
        .eq('department_id', department.id)

      if (usersUsingDept && usersUsingDept.length > 0) {
        alert(`部署「${department.name}」を使用しているユーザーが${usersUsingDept.length}人います。先にユーザーの部署を変更してください。`)
        return
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id)

      if (error) {
        console.error('部署削除エラー:', error)
        throw error
      }

      await fetchDepartments()
      setDeleteConfirm(null)
      alert('部署が削除されました')
    } catch (error) {
      console.error('部署削除エラー:', error)
      alert('部署の削除に失敗しました')
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<DepartmentFormData> = {}

    if (!formData.name.trim()) {
      errors.name = '部署名は必須です'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      if (editingDepartment) {
        // 部署更新
        const { error } = await supabase
          .from('departments')
          .update({
            name: formData.name.trim(),
            parent_id: formData.parent_id || null
          })
          .eq('id', editingDepartment.id)

        if (error) {
          console.error('部署更新エラー:', error)
          throw error
        }

        alert('部署が更新されました')
      } else {
        // 部署作成
        console.log('部署作成開始:', {
          name: formData.name.trim(),
          parent_id: formData.parent_id || null
        })

        // 現在のユーザーの会社IDを取得
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', currentUser?.id)
          .single()

        const companyId = userData?.company_id

        if (!companyId) {
          throw new Error('会社IDが取得できません。ユーザーが正しく会社に所属しているか確認してください。')
        }

        const { data, error } = await supabase
          .from('departments')
          .insert({
            name: formData.name.trim(),
            parent_id: formData.parent_id || null,
            company_id: companyId
          })
          .select()

        if (error) {
          console.error('部署作成エラー:', error)
          console.error('エラー詳細:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          console.error('送信データ:', {
            name: formData.name.trim(),
            parent_id: formData.parent_id || null,
            company_id: companyId
          })
          throw error
        }

        console.log('部署作成成功:', data)
        alert('部署が作成されました')
      }

      await fetchDepartments()
      setShowForm(false)
      setEditingDepartment(null)
      setFormData({ name: '', parent_id: '' })
    } catch (error) {
      console.error('部署操作エラー:', error)
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message)
        console.error('エラースタック:', error.stack)
      }
      alert(editingDepartment ? '部署の更新に失敗しました' : '部署の作成に失敗しました')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingDepartment(null)
    setFormData({ name: '', parent_id: '' })
    setFormErrors({})
  }

  const getParentDepartmentName = (parentId: string | null) => {
    if (!parentId) return 'なし'
    const parent = departments.find(dept => dept.id === parentId)
    return parent ? parent.name : '不明'
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 新規作成ボタン */}
      <button
        onClick={handleCreateDepartment}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        新規部署追加
      </button>

      {/* 部署一覧 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {departments.map((department) => (
            <li key={department.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {department.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        親部署: {getParentDepartmentName(department.parent_id)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    編集
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(department)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
          {(!departments || departments.length === 0) && (
            <li className="px-6 py-8 text-center text-gray-500">
              部署がまだ作成されていません
            </li>
          )}
        </ul>
      </div>

      {/* 部署フォームモーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDepartment ? '部署編集' : '新規部署追加'}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  部署名 *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 技術部"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  親部署
                </label>
                <select
                  id="parent_id"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">親部署なし</option>
                  {departments
                    .filter(dept => !editingDepartment || dept.id !== editingDepartment.id)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingDepartment ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">部署の削除</h3>
                <p className="text-sm text-gray-600">この操作は取り消せません</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                部署 <strong>{deleteConfirm.name}</strong> を削除しますか？
              </p>
              <p className="text-sm text-red-600 mt-2">
                削除すると、この部署に所属するユーザーは部署なしになります。
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteDepartment(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
