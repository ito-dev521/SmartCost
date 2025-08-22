'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { User, Department } from '@/types/database'
import { UserPlus, Edit, X, Save, Shield, Users, Eye } from 'lucide-react'

interface UserFormProps {
  user?: User | null
  departments?: Department[]
  onClose?: () => void
  onSuccess?: () => void
}

interface UserFormData {
  email: string
  name: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  department_id: string
}

const initialFormData: UserFormData = {
  email: '',
  name: '',
  role: 'user',
  department_id: ''
}

const roleConfig = {
  admin: { label: '管理者', color: 'bg-purple-100 text-purple-800', icon: Shield },
  manager: { label: 'マネージャー', color: 'bg-blue-100 text-blue-800', icon: Users },
  user: { label: '一般ユーザー', color: 'bg-green-100 text-green-800', icon: Users },
  viewer: { label: 'ビューアー', color: 'bg-gray-100 text-gray-800', icon: Eye }
}

export default function UserForm({ user, departments = [], onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>(() => {
    if (user) {
      return {
        email: user.email,
        name: user.name,
        role: user.role as UserFormData['role'],
        department_id: user.department_id || ''
      }
    }
    return initialFormData
  })

  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const isEditing = !!user

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'メールアドレスの形式が正しくありません'
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です'
    }

    if (!formData.role) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newErrors.role = 'ロールは必須です' as any
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    startTransition(async () => {
      try {
        setSubmitError(null)

        // 認証トークンを取得
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('認証が必要です。再度ログインしてください。')
        }

        if (isEditing && user) {
          // ユーザー更新
          const response = await fetch('/api/users', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              id: user.id,
              email: formData.email,
              name: formData.name,
              role: formData.role,
              department_id: formData.department_id || null
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'ユーザーの更新に失敗しました')
          }
        } else {
          // ユーザー作成
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              email: formData.email,
              name: formData.name,
              role: formData.role,
              department_id: formData.department_id || null
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'ユーザーの作成に失敗しました')
          }
        }

        // 成功時の処理
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }

        if (onClose) {
          onClose()
        }

      } catch (error) {
        console.error('User form error:', error)
        setSubmitError(error instanceof Error ? error.message : '操作に失敗しました')
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // エラークリア
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <Edit className="h-6 w-6 text-blue-600" />
          ) : (
            <UserPlus className="h-6 w-6 text-green-600" />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'ユーザー編集' : '新規ユーザー追加'}
            </h2>
            <p className="text-sm text-gray-600">
              {isEditing ? 'ユーザー情報を編集します' : '新しいユーザーを追加します'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 名前 */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名前 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例: 田中太郎"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* メールアドレス */}
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isEditing} // 編集時はメールアドレス変更不可
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } ${isEditing ? 'bg-gray-100 text-gray-500' : ''}`}
              placeholder="例: tanaka@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">メールアドレスは変更できません</p>
            )}
          </div>

          {/* ロール */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              ロール *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {Object.entries(roleConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* 部署 */}
          <div>
            <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
              部署
            </label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">部署未設定</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ロール説明 */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">選択されたロールの権限</h4>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = roleConfig[formData.role].icon
              return <Icon className="h-4 w-4 text-gray-600" />
            })()}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig[formData.role].color}`}>
              {roleConfig[formData.role].label}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {formData.role === 'admin' && '管理者権限: ユーザー管理、システム設定、全プロジェクトの管理'}
            {formData.role === 'manager' && 'マネージャー権限: プロジェクト管理、レポート閲覧、チーム管理'}
            {formData.role === 'user' && '一般ユーザー権限: プロジェクト管理、原価入力、基本レポート'}
            {formData.role === 'viewer' && 'ビューアー権限: プロジェクト閲覧、レポート閲覧のみ'}
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isPending}
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditing ? '更新中...' : '作成中...'}
              </>
            ) : (
              <>
                {isEditing ? <Edit className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isEditing ? '更新' : '作成'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
