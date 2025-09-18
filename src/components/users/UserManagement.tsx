'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { User, Department } from '@/types/database'
import UserForm from './UserForm'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Shield,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'

interface UserManagementProps {
  onUserUpdate?: () => void
}

export default function UserManagement({ onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
    fetchDepartments()
  }, [searchParams])

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id || null)
    } catch (error) {
      console.error('❌ UserManagement: 現在のユーザー取得エラー:', error)
      setCurrentUserId(null)
    }
  }

  const fetchUsers = async () => {
    try {

      // Supabaseクライアントからセッションを取得
      const supabase = createClientComponentClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.error('❌ UserManagement: 認証セッションなし')
        setUsers([])
        alert('認証が必要です。再度ログインしてください。')
        return
      }


      // 現在ログインしているユーザーの会社IDを取得
      if (!session?.user?.id) {
        throw new Error('認証セッションが無効です')
      }

      // ユーザーの会社IDを取得
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (currentUserError || !currentUser?.company_id) {
        console.error('❌ UserManagement: 現在のユーザーの会社ID取得エラー:', currentUserError)
        throw new Error('ユーザーの会社情報を取得できませんでした')
      }

      const companyId = currentUser.company_id
      
      const endpoint = `/api/users?companyId=${encodeURIComponent(companyId)}`
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include' // クッキーを含める
      })


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ UserManagement: APIエラー:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch users`)
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('❌ UserManagement: fetchUsersエラー:', error)
      // エラーをユーザーに表示
      setUsers([])
      alert(`ユーザーの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      
      // 現在のユーザーの会社IDを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        console.error('❌ UserManagement: 認証セッションなし')
        setDepartments([])
        return
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (currentUserError || !currentUser?.company_id) {
        console.error('❌ UserManagement: 現在のユーザーの会社ID取得エラー:', currentUserError)
        setDepartments([])
        return
      }

      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .order('name')
      
      if (error) {
        console.error('❌ UserManagement: 部署取得エラー:', error)
        throw error
      }

      setDepartments(data || [])
    } catch (error) {
      console.error('❌ UserManagement: fetchDepartmentsエラー:', error)
      setDepartments([])
    }
  }

  // ユーザー削除処理
  const handleUserDelete = async (user: User) => {
    try {
      
      // セッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認証が必要です。再度ログインしてください。')
      }

      // 自分自身を削除しようとしている場合は拒否
      if (user.id === session.user.id) {
        throw new Error('自分自身のアカウントは削除できません')
      }

      // 削除確認
      if (!confirm(`ユーザー "${user.name}" (${user.email}) を本当に削除しますか？\n\nこの操作は取り消せません。`)) {
        return
      }

      // APIでユーザー削除を実行
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `削除に失敗しました (HTTP ${response.status})`)
      }

      
      // 削除確認ダイアログを閉じる
      setDeleteConfirm(null)
      
      // ユーザー一覧を再取得
      await fetchUsers()
      
      // 成功メッセージ
      alert('ユーザーが正常に削除されました')
      
    } catch (error) {
      console.error('❌ UserManagement: ユーザー削除エラー:', error)
      alert(`ユーザーの削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  const handleUserCreate = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleUserEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }



  const handleFormSuccess = () => {
    fetchUsers()
    setShowForm(false)
    setEditingUser(null)
    if (onUserUpdate) onUserUpdate()
    
    // 自動更新機能は無効化
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const filteredUsers = users.filter(user => {
    // スーパー管理者は除外
    if (user.role === 'superadmin') {
      return false
    }
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // 現在ログインしているユーザーかどうかを判定する関数
  const isCurrentUser = (user: User) => {
    return currentUserId === user.id
  }

  const roleConfig = {
    admin: { label: '管理者', color: 'bg-purple-100 text-purple-800' },
    superadmin: { label: 'スーパー管理者', color: 'bg-red-100 text-red-800' },
    manager: { label: 'マネージャー', color: 'bg-blue-100 text-blue-800' },
    user: { label: '一般ユーザー', color: 'bg-green-100 text-green-800' },
    viewer: { label: 'ビューアー', color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
            <p className="text-sm text-gray-600">システムユーザーの管理と権限設定</p>
          </div>
        </div>
        <button
          onClick={handleUserCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          新規ユーザー追加
        </button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role !== 'superadmin').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">管理者数</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">一般ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="名前またはメールアドレスで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべてのロール</option>
              <option value="admin">管理者</option>
              <option value="manager">マネージャー</option>
              <option value="user">一般ユーザー</option>
              <option value="viewer">ビューアー</option>
            </select>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">ユーザー一覧</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className={`p-6 hover:bg-gray-50 ${isCurrentUser(user) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                      {isCurrentUser(user) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          現在のユーザー
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[user.role as keyof typeof roleConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {roleConfig[user.role as keyof typeof roleConfig]?.label || user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUserEdit(user)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    編集
                  </button>
                  {isCurrentUser(user) ? (
                    <button
                      disabled
                      className="text-gray-400 text-sm px-3 py-1 rounded-md bg-gray-100 cursor-not-allowed flex items-center gap-1"
                      title="自分自身のアカウントは削除できません"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除不可
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ユーザーが見つかりませんでした</p>
              <p className="text-sm mt-1">検索条件を変更するか、新しいユーザーを追加してください</p>
            </div>
          )}
        </div>
      </div>

      {/* フォームモーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <UserForm
              user={editingUser}
              departments={departments}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
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
                <h3 className="text-lg font-semibold text-gray-900">ユーザーの削除</h3>
                <p className="text-sm text-gray-600">この操作は取り消せません</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                ユーザー <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email}) を削除しますか？
              </p>
              <p className="text-sm text-red-600 mt-2">
                削除すると、このユーザーのすべてのデータと権限が失われます。
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
                onClick={() => handleUserDelete(deleteConfirm)}
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












