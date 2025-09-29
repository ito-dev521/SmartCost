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
  order_form_name: string
  description: string
  client_id: string
  client_name: string
  person_in_charge: string
  budget: string
  start_date: string
  end_date: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
}

const initialFormData: ProjectFormData = {
  name: '',
  business_number: '',
  order_form_name: '',
  description: '',
  client_id: '',
  client_name: '',
  person_in_charge: '',
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

interface ProjectEditFormProps {
  projectId: string
}

export default function ProjectEditForm({ projectId }: ProjectEditFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({})
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingProject, setLoadingProject] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // プロジェクト情報を取得
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoadingProject(true)

        const { data: { session } } = await supabase.auth.getSession()
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'GET',
          headers,
        })

        if (response.ok) {
          const data = await response.json()
          
          const project = data.project
          // 注文書名が既に入力されており、ステータスが「計画中」の場合、「進行中」に自動変更
          let initialStatus = project.status || 'planning'
          if (project.order_form_name && project.order_form_name.trim() && initialStatus === 'planning') {
            initialStatus = 'in_progress'
          }

          setFormData({
            name: project.name || '',
            business_number: project.business_number || '',
            order_form_name: project.order_form_name || '',
            description: project.description || '',
            client_id: project.client_id || '',
            client_name: project.client_name || '',
            person_in_charge: project.person_in_charge || '',
            budget: project.contract_amount?.toString() || '',
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            status: initialStatus
          })
        } else {
          const errorText = await response.text()
          console.error('❌ ProjectEditForm: プロジェクト取得エラー:', errorText)
          setSubmitError('プロジェクト情報の取得に失敗しました')
        }
      } catch (error) {
        console.error('❌ ProjectEditForm: プロジェクト取得エラー:', error)
        setSubmitError('プロジェクト情報の取得に失敗しました')
      } finally {
        setLoadingProject(false)
      }
    }

    fetchProject()
  }, [projectId, supabase.auth])

  // クライアント一覧を取得
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // setLoadingClients(true)

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
          console.error('❌ ProjectEditForm: クライアント取得エラー:', errorText)
        }
      } catch (error) {
        console.error('❌ ProjectEditForm: クライアント取得エラー:', error)
      } finally {
        // setLoadingClients(false)
      }
    }

    fetchClients()
  }, [supabase.auth])



  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です'
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
          order_form_name: formData.order_form_name.trim(),
          client_id: formData.client_id,
          client_name: formData.client_name,
          person_in_charge: formData.person_in_charge.trim(),
          contract_amount: formData.budget ? Number(formData.budget) : 0,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status
        }


        const { data: { session } } = await supabase.auth.getSession()
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(projectData)
        })


        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ ProjectEditForm: APIエラー:', errorText)
          throw new Error(`プロジェクト更新に失敗しました (${response.status})`)
        }

        await response.json()

        // 成功したらプロジェクト一覧ページにリダイレクト
        const cidMatch2 = document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/)
        const cid2 = cidMatch2 ? decodeURIComponent(cidMatch2[1]) : ''
        router.push(cid2 ? `/projects?companyId=${encodeURIComponent(cid2)}` : '/projects')
        router.refresh()

      } catch (error) {
        console.error('プロジェクト更新エラー:', error)
        setSubmitError('プロジェクトの更新に失敗しました。もう一度お試しください。')
      }
    })
  }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }

    // 注文書名が入力され、現在のステータスが「計画中」の場合、「進行中」に変更
    if (name === 'order_form_name' && value.trim() && formData.status === 'planning') {
      newFormData.status = 'in_progress'
    }

    setFormData(newFormData)

    // エラーをクリア
    if (errors[name as keyof ProjectFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value
    const selectedClient = clients.find(client => client.id === clientId)
    
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: selectedClient?.name || ''
    }))

    if (errors.client_id) {
      setErrors(prev => ({ ...prev, client_id: undefined }))
    }
  }

  if (loadingProject) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (submitError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {submitError}
        </div>
        <div className="mt-4">
          <Link
            href={(() => { const m=document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/); const c=m?decodeURIComponent(m[1]):''; return c?`/projects?companyId=${encodeURIComponent(c)}`:'/projects' })()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    )
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
          プロジェクト編集
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
                placeholder="プロジェクト名を入力"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* 業務番号 */}
          <div className="md:col-span-2">
            <label htmlFor="business_number" className="block text-sm font-medium text-gray-700 mb-2">
              業務番号 * （変更不可）
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="business_number"
                name="business_number"
                value={formData.business_number}
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="例: E04-031"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">業務番号は作成後に変更できません</p>
          </div>

          {/* 注文書名 */}
          <div className="md:col-span-2">
            <label htmlFor="order_form_name" className="block text-sm font-medium text-gray-700 mb-2">
              注文書名
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="order_form_name"
                name="order_form_name"
                value={formData.order_form_name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="注文書名を入力"
              />
            </div>
          </div>

          {/* クライアント選択 */}
          <div className="md:col-span-2">
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              発注者 *
            </label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleClientChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.client_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
                              <option value="">発注者を選択</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
          </div>

          {/* 担当者 */}
          <div className="md:col-span-2">
            <label htmlFor="person_in_charge" className="block text-sm font-medium text-gray-700 mb-2">
              担当者
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="person_in_charge"
                name="person_in_charge"
                value={formData.person_in_charge}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="担当者名を入力"
              />
            </div>
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
            href="/projects"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? '更新中...' : '更新'}
          </button>
        </div>
      </form>
    </div>
  )
}
