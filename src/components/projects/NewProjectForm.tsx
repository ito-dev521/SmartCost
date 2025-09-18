'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { Client } from '@/types/database'
import {
  Building2,
  Calendar,
  Users,
  FileText,
  ArrowLeft,
  Save
} from 'lucide-react'
import Link from 'next/link'

interface ProjectFormData {
  name: string
  business_number: string
  description: string
  client_id: string
  client_name: string // 既存データとの互換性のため残す
  budget: string
  start_date: string
  end_date: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
}

const initialFormData: ProjectFormData = {
  name: '',
  business_number: '',
  description: '',
  client_id: '',
  client_name: '',
  budget: '',
  start_date: '',
  end_date: '',
  status: 'planning'
}

const statusOptions = [
  { value: 'planning', label: '計画中' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' },
  { value: 'on_hold', label: '保留中' },
  { value: 'cancelled', label: '中止' }
]

export default function NewProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({})
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [businessNumberError, setBusinessNumberError] = useState<string>('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  // クライアント一覧を取得
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true)

        // 認証トークンを取得
        const { data: { session } } = await supabase.auth.getSession()

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const cidMatch = document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/)
        const cid = cidMatch ? decodeURIComponent(cidMatch[1]) : ''
        const clientsEndpoint = `/api/clients${cid ? `?companyId=${encodeURIComponent(cid)}` : ''}`
        const response = await fetch(clientsEndpoint, {
          method: 'GET',
          headers,
        })


        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        } else {
          const errorText = await response.text()
          console.error('❌ NewProjectForm: APIエラー:', errorText)
        }
      } catch (error) {
        console.error('❌ NewProjectForm: クライアント取得エラー:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [supabase.auth])

  // 業務番号の重複チェック
  const checkBusinessNumberDuplicate = async (businessNumber: string) => {
    if (!businessNumber.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/projects', {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        const existingProject = data.projects?.find((p: {
          business_number: string
          name: string
        }) => 
          p.business_number === businessNumber
        )

        if (existingProject) {
          setBusinessNumberError(`業務番号「${businessNumber}」は既に使用されています（プロジェクト: ${existingProject.name}）`)
        }
      }
    } catch (error) {
      console.error('❌ 業務番号重複チェックエラー:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です'
    }

    if (!formData.business_number.trim()) {
      newErrors.business_number = '業務番号は必須です'
    } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.business_number.trim())) {
      newErrors.business_number = '業務番号は半角英数、ハイフン、アンダースコアのみ入力可能です'
    } else if (businessNumberError) {
      newErrors.business_number = businessNumberError
    }

    if (!formData.client_id.trim()) {
      newErrors.client_id = '発注者は必須です'
    }

    if (!formData.start_date) {
      newErrors.start_date = '開始日は必須です'
    }

    if (!formData.end_date) {
      newErrors.end_date = '終了日は必須です'
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = '終了日は開始日より後の日付にしてください'
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = '契約金額は数値で入力してください'
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

        const projectData = {
          name: formData.name.trim(),
          business_number: formData.business_number.trim(),
          client_id: formData.client_id,
          client_name: formData.client_name, // 既存データとの互換性のため残す
          contract_amount: formData.budget ? Number(formData.budget) : 0,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status
          // description: formData.description.trim() || null  // 一時的に除外
        }


        // 認証トークンを取得
        const { data: { session } } = await supabase.auth.getSession()

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        // APIエンドポイントを呼び出し
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify(projectData)
        })


        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ NewProjectForm: APIエラー:', errorText)
          throw new Error(`プロジェクト作成に失敗しました (${response.status})`)
        }

        const result = await response.json()

        // 成功したらプロジェクト一覧ページにリダイレクト
        router.push('/projects')
        router.refresh()

      } catch (error) {
        console.error('プロジェクト作成エラー:', error)
        setSubmitError('プロジェクトの作成に失敗しました。もう一度お試しください。')
      }
    })
  }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // エラーをクリア
    if (errors[name as keyof ProjectFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }

    // 業務番号の重複チェック
    if (name === 'business_number' && value.trim()) {
      setBusinessNumberError('')
      // 入力が完了してから重複チェック（500ms後）
      setTimeout(() => {
        checkBusinessNumberDuplicate(value.trim())
      }, 500)
    }
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <Link
          href={(() => { const m=document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/); const c=m?decodeURIComponent(m[1]):''; return c?`/projects?companyId=${encodeURIComponent(c)}`:'/projects' })()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          プロジェクト一覧に戻る
        </Link>
        <div className="flex items-center text-sm text-gray-500">
          <Building2 className="w-4 h-4 mr-1" />
          新規プロジェクト作成
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* プロジェクト名 */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト名 *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 〇〇ビル建設プロジェクト"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* 業務番号 */}
          <div className="md:col-span-2">
            <label htmlFor="business_number" className="block text-sm font-medium text-gray-700 mb-2">
              業務番号 *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="business_number"
                name="business_number"
                value={formData.business_number}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.business_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: E04-031"
                pattern="[A-Za-z0-9\-_]+"
                title="半角英数、ハイフン、アンダースコアのみ入力可能"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">半角英数、ハイフン(-)、アンダースコア(_)のみ入力可能</p>
            {businessNumberError && <p className="mt-1 text-sm text-red-600">{businessNumberError}</p>}
            {errors.business_number && <p className="mt-1 text-sm text-red-600">{errors.business_number}</p>}
          </div>

          {/* 説明 */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト説明
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="プロジェクトの詳細な説明を入力してください"
              />
            </div>
          </div>

          {/* クライアント */}
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              発注者 *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={(e) => {
                  const selectedClientId = e.target.value
                  const selectedClient = clients.find(c => c.id === selectedClientId)
                  setFormData(prev => ({
                    ...prev,
                    client_id: selectedClientId,
                    client_name: selectedClient?.name || ''
                  }))
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
                  errors.client_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loadingClients}
              >
                <option value="">
                  {loadingClients ? '発注者を読み込み中...' : '発注者を選択してください'}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.contact_person && ` (${client.contact_person})`}
                  </option>
                ))}
              </select>
              {/* カスタムドロップダウン矢印 */}
              <div className="absolute right-3 top-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
            {clients.length === 0 && !loadingClients && (
              <p className="mt-1 text-sm text-blue-600">
                発注者が登録されていません。
                <a href="/clients/new" className="underline hover:no-underline">
                  新しい発注者を作成
                </a>
              </p>
            )}
          </div>



          {/* 契約金額 */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              契約金額（円）
            </label>
            <div className="relative">
              <input
                type="text"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.budget ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例: 100000000"
              />
            </div>
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>



          {/* 開始日 */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              開始日 *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
          </div>

          {/* 終了日 */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              終了日 *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
          </div>

          {/* ステータス */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Link
            href={(() => { const m=document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/); const c=m?decodeURIComponent(m[1]):''; return c?`/projects?companyId=${encodeURIComponent(c)}`:'/projects' })()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                作成中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                プロジェクトを作成
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
