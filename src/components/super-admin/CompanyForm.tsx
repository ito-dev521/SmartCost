'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Company } from '@/types/database'
import { Building2, Save, X } from 'lucide-react'

interface CompanyFormProps {
  company?: Company | null
  onSubmit?: (data: CompanyFormData) => Promise<void>
  onCancel?: () => void
}

export interface CompanyFormData {
  name: string
  contact_name?: string
  email?: string
  address?: string
  phone?: string
  caddon_enabled?: boolean
}

export default function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name || '',
    contact_name: (company as any)?.contact_name || '',
    email: (company as any)?.email || '',
    address: (company as any)?.address || '',
    phone: (company as any)?.phone || '',
    caddon_enabled: (company as any)?._settings?.caddon_enabled ?? true
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setSubmitError('法人名は必須です')
      return false
    }
    if (formData.name.trim().length < 2) {
      setSubmitError('法人名は2文字以上で入力してください')
      return false
    }
    if (!formData.email || !formData.email.trim()) {
      setSubmitError('メールアドレスは必須です')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSubmitError('メールアドレスの形式が正しくありません')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    startTransition(async () => {
      try {
        setSubmitError(null)

        if (onSubmit) {
          await onSubmit(formData)
        } else {
          // デフォルトの送信処理
          const response = await fetch(
            company ? `/api/super-admin/companies/${company.id}` : '/api/super-admin/companies',
            {
              method: company ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          )

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '法人の保存に失敗しました')
          }

          router.push('/super-admin')
          router.refresh()
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : '法人の保存に失敗しました')
      }
    })
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {company ? '法人情報編集' : '新規法人登録'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 法人名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="h-4 w-4 inline mr-1" />
            法人名 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="株式会社○○建設"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            正式な法人名を入力してください（例：株式会社○○建設、○○株式会社）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 担当者名 */}
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
              担当者名
            </label>
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              value={formData.contact_name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田 太郎"
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@example.com"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              法人管理者のログイン用メールアドレスです。アカウント作成後にログイン情報が送信されます。
            </p>
          </div>
        </div>
        {/* CADDON システム */}
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div>
            <p className="text-sm font-medium text-gray-700">CADDONシステムを有効にする</p>
            <p className="text-xs text-gray-500">無効にするとCADDON関連機能はこの法人では使用できません。</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" name="caddon_enabled" checked={!!formData.caddon_enabled} onChange={handleToggle} className="h-4 w-4" />
          </label>
        </div>

        {/* 住所 */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            住所
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="東京都千代田区丸の内1-1-1"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            電話番号
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="03-1234-5678"
          />
        </div>

        {/* 作成・更新日時（表示のみ） */}
        {company && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作成日時
              </label>
              <p className="text-sm text-gray-600">
                {new Date(company.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
            {company.updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最終更新日時
                </label>
                <p className="text-sm text-gray-600">
                  {new Date(company.updated_at).toLocaleString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end space-x-4">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {company ? '更新' : '登録'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
















