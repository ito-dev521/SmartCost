'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

interface UserFormData {
  email: string
  name: string
  role: 'admin' | 'user'
  department_id: string
}

interface AdminUserFormProps {
  departments: Array<{ id: string; name: string }>
}

export default function AdminUserForm({ departments }: AdminUserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'user',
    department_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'ユーザーが正常に作成されました' })
        setFormData({ email: '', name: '', role: 'user', department_id: '' })
      } else {
        setMessage({ type: 'error', text: result.error || 'エラーが発生しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        管理者ユーザー登録
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example@example.com"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            名前
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="山田太郎"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            権限
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="user">一般ユーザー</option>
            <option value="admin">管理者</option>
          </select>
        </div>

        <div>
          <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
            部署
          </label>
          <select
            id="department_id"
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">部署未設定</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '作成中...' : 'ユーザーを作成'}
        </button>
      </form>
    </div>
  )
}




