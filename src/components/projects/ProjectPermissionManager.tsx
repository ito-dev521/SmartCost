'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { User, Department } from '@/types/database'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  PenTool,
  Crown,
  Search
} from 'lucide-react'

interface ProjectPermission {
  id: string
  user_id: string
  project_id: string
  permission_level: 'read' | 'write' | 'admin'
  created_at: string
  users: User
}

interface ProjectPermissionManagerProps {
  projectId: string
  projectName: string
}

const permissionConfig = {
  read: { label: '閲覧', color: 'bg-blue-100 text-blue-800', icon: Eye, description: 'プロジェクトの閲覧のみ' },
  write: { label: '編集', color: 'bg-green-100 text-green-800', icon: PenTool, description: '原価入力・編集可能' },
  admin: { label: '管理者', color: 'bg-purple-100 text-purple-800', icon: Crown, description: '全権限・権限管理可能' }
}

export default function ProjectPermissionManager({ projectId, projectName }: ProjectPermissionManagerProps) {
  const [permissions, setPermissions] = useState<ProjectPermission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'write' | 'admin'>('read')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPermissions()
    fetchUsers()
    fetchDepartments()
  }, [projectId])

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/projects/permissions?projectId=${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name')
      setDepartments(departments || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleAddPermission = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/projects/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          userId: selectedUser.id,
          permissionLevel: selectedPermission
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add permission')
      }

      await fetchPermissions()
      setShowAddUser(false)
      setSelectedUser(null)
      setSelectedPermission('read')
    } catch (error) {
      console.error('Error adding permission:', error)
      alert('権限の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePermission = async (userId: string, permissionLevel: 'read' | 'write' | 'admin') => {
    try {
      const response = await fetch('/api/projects/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          userId,
          permissionLevel
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update permission')
      }

      await fetchPermissions()
    } catch (error) {
      console.error('Error updating permission:', error)
      alert('権限の更新に失敗しました')
    }
  }

  const handleRemovePermission = async (userId: string) => {
    if (!confirm('このユーザーの権限を削除しますか？')) return

    try {
      const response = await fetch(`/api/projects/permissions?projectId=${projectId}&userId=${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove permission')
      }

      await fetchPermissions()
    } catch (error) {
      console.error('Error removing permission:', error)
      alert('権限の削除に失敗しました')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const hasPermission = !permissions.some(p => p.user_id === user.id)
    return matchesSearch && hasPermission
  })

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
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
          <Shield className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">プロジェクト権限管理</h3>
            <p className="text-sm text-gray-600">{projectName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          ユーザーを追加
        </button>
      </div>

      {/* 権限一覧 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-semibold">割り当て済みユーザー</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {permissions.map((permission) => {
            const config = permissionConfig[permission.permission_level]
            const Icon = config.icon
            return (
              <div key={permission.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {permission.users.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-md font-medium text-gray-900">{permission.users.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{permission.users.email}</span>
                        <span>ロール: {permission.users.role === 'admin' ? '管理者' : permission.users.role === 'manager' ? 'マネージャー' : permission.users.role === 'user' ? '一般ユーザー' : 'ビューアー'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={permission.permission_level}
                      onChange={(e) => handleUpdatePermission(permission.user_id, e.target.value as 'read' | 'write' | 'admin')}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="read">閲覧</option>
                      <option value="write">編集</option>
                      <option value="admin">管理者</option>
                    </select>
                    <button
                      onClick={() => handleRemovePermission(permission.user_id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {permissions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>まだユーザーが割り当てられていません</p>
              <p className="text-sm mt-1">「ユーザーを追加」ボタンからユーザーを割り当ててください</p>
            </div>
          )}
        </div>
      </div>

      {/* 権限説明 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="text-md font-semibold mb-4">権限レベルについて</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(permissionConfig).map(([level, config]) => {
            const Icon = config.icon
            return (
              <div key={level} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ユーザー追加モーダル */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">ユーザーをプロジェクトに追加</h3>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* 検索 */}
              <div className="mb-4">
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

              {/* ユーザー選択 */}
              <div className="mb-6 max-h-64 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 border rounded-md mb-2 cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">該当するユーザーが見つかりません</p>
                )}
              </div>

              {/* 権限選択 */}
              {selectedUser && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    権限レベル
                  </label>
                  <select
                    value={selectedPermission}
                    onChange={(e) => setSelectedPermission(e.target.value as 'read' | 'write' | 'admin')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="read">閲覧 - プロジェクトの閲覧のみ</option>
                    <option value="write">編集 - 原価入力・編集可能</option>
                    <option value="admin">管理者 - 全権限・権限管理可能</option>
                  </select>
                </div>
              )}

              {/* ボタン */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddPermission}
                  disabled={!selectedUser || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '追加中...' : '追加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}







