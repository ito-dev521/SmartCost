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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      console.log('部署管理: 部署一覧取得開始...')
      
      // 現在のユーザーの会社IDを取得
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        setMessage({ type: 'error', text: 'ユーザーが認証されていません' })
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', currentUser.id)
        .single()

      const companyId = userData?.company_id

      if (!companyId) {
        // デフォルト会社を取得または作成
        const { data: defaultCompany } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .single()

        if (defaultCompany) {
          // ユーザーの会社IDを更新
          await supabase
            .from('users')
            .update({ company_id: defaultCompany.id })
            .eq('id', currentUser.id)

          // 部署を取得
          const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', defaultCompany.id)
            .order('name')

          if (error) {
            console.error('部署取得エラー:', error)
            setMessage({ type: 'error', text: '部署の取得に失敗しました' })
            setDepartments([])
          } else {
            console.log('部署取得成功:', data?.length || 0, '件')
            setDepartments(data || [])
          }
        } else {
          setMessage({ type: 'error', text: '会社情報が見つかりません' })
          setDepartments([])
        }
      } else {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', companyId)
          .order('name')

        if (error) {
          console.error('部署取得エラー:', error)
          setMessage({ type: 'error', text: '部署の取得に失敗しました' })
          setDepartments([])
        } else {
          console.log('部署取得成功:', data?.length || 0, '件')
          setDepartments(data || [])
        }
      }
    } catch (error) {
      console.error('部署取得エラー:', error)
      setMessage({ type: 'error', text: '部署の取得に失敗しました' })
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = () => {
    setEditingDepartment(null)
    setFormData({ name: '', parent_id: '' })
    setFormErrors({})
    setMessage(null)
    setShowForm(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      parent_id: department.parent_id || ''
    })
    setFormErrors({})
    setMessage(null)
    setShowForm(true)
  }

  const handleDeleteDepartment = async (department: Department) => {
    try {
      // 子部署があるかチェック
      const hasChildren = departments.some(dept => dept.parent_id === department.id)
      if (hasChildren) {
        setMessage({ type: 'error', text: '子部署を持つ部署は削除できません。先に子部署を削除してください。' })
        return
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id)

      if (error) {
        console.error('部署削除エラー:', error)
        setMessage({ type: 'error', text: '部署の削除に失敗しました' })
        return
      }

      setMessage({ type: 'success', text: '部署を削除しました' })
      setDeleteConfirm(null)
      fetchDepartments()
    } catch (error) {
      console.error('部署削除エラー:', error)
      setMessage({ type: 'error', text: '部署の削除に失敗しました' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    const errors: Partial<DepartmentFormData> = {}
    if (!formData.name.trim()) {
      errors.name = '部署名は必須です'
    }
    
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      // 現在のユーザーの会社IDを取得
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', currentUser?.id)
        .single()

      const companyId = userData?.company_id

      if (!companyId) {
        setMessage({ type: 'error', text: '会社情報が見つかりません' })
        return
      }

      const departmentData = {
        name: formData.name.trim(),
        company_id: companyId,
        ...(formData.parent_id && { parent_id: formData.parent_id })
      }

      if (editingDepartment) {
        // 編集
        const { error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', editingDepartment.id)

        if (error) {
          console.error('部署更新エラー:', error)
          setMessage({ type: 'error', text: '部署の更新に失敗しました' })
          return
        }

        setMessage({ type: 'success', text: '部署を更新しました' })
      } else {
        // 新規作成
        const { error } = await supabase
          .from('departments')
          .insert([departmentData])

        if (error) {
          console.error('部署作成エラー:', error)
          setMessage({ type: 'error', text: '部署の作成に失敗しました' })
          return
        }

        setMessage({ type: 'success', text: '部署を作成しました' })
      }

      setShowForm(false)
      fetchDepartments()
    } catch (error) {
      console.error('部署保存エラー:', error)
      setMessage({ type: 'error', text: '部署の保存に失敗しました' })
    }
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'なし'
    const parent = departments.find(dept => dept.id === parentId)
    return parent ? parent.name : '不明'
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        {/* メッセージ表示 */}
        {message && (
          <div className={`rounded-md p-4 mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* 部署一覧 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">部署一覧</h3>
          <button
            onClick={handleCreateDepartment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            新規部署
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">部署が登録されていません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部署名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    親部署
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((department) => (
                  <tr key={department.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getParentName(department.parent_id ?? null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(department.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(department)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 部署作成・編集フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDepartment ? '部署編集' : '新規部署作成'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="部署名を入力"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    親部署
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">親部署なし</option>
                    {departments
                      .filter(dept => !editingDepartment || dept.id !== editingDepartment.id)
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingDepartment ? '更新' : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">部署削除確認</h3>
              <p className="text-sm text-gray-500 mb-6">
                部署「{deleteConfirm.name}」を削除しますか？この操作は取り消せません。
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDeleteDepartment(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
