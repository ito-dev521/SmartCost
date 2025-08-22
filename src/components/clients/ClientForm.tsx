'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Client } from '@/types/database'
import { Building2, User, Mail, Phone, MapPin, Briefcase, FileText, Save, X } from 'lucide-react'

interface ClientFormProps {
  client?: Client | null
  onSubmit?: (data: ClientFormData) => Promise<void>
  onCancel?: () => void
}

export interface ClientFormData {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  industry: string
  notes: string
  payment_cycle_type: string
  payment_cycle_closing_day: number | null
  payment_cycle_payment_month_offset: number | null
  payment_cycle_payment_day: number | null
  payment_cycle_description: string
}

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || '',
    contact_person: client?.contact_person || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    industry: client?.industry || '',
    notes: client?.notes || '',
    payment_cycle_type: client?.payment_cycle_type || 'month_end',
    payment_cycle_closing_day: client?.payment_cycle_closing_day || 31,
    payment_cycle_payment_month_offset: client?.payment_cycle_payment_month_offset || 1,
    payment_cycle_payment_day: client?.payment_cycle_payment_day || 31,
    payment_cycle_description: client?.payment_cycle_description || '月末締め翌月末払い',
  })

  // 初期化時に説明を生成
  useEffect(() => {
    if (!client?.payment_cycle_description) {
      updatePaymentCycleDescription()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === '' ? null : parseInt(value, 10)
    setFormData(prev => ({ ...prev, [name]: numValue }))
  }

  const updatePaymentCycleDescription = () => {
    const { payment_cycle_type, payment_cycle_closing_day, payment_cycle_payment_month_offset, payment_cycle_payment_day } = formData
    
    let description = ''
    if (payment_cycle_type === 'month_end') {
      description = '月末締め'
    } else if (payment_cycle_type === 'specific_date') {
      description = `${payment_cycle_closing_day}日締め`
    }
    
    if (payment_cycle_payment_month_offset === 0) {
      description += '当月'
    } else if (payment_cycle_payment_month_offset === 1) {
      description += '翌月'
    } else {
      description += `${payment_cycle_payment_month_offset}ヶ月後`
    }
    
    description += `${payment_cycle_payment_day}日払い`
    
    setFormData(prev => ({ ...prev, payment_cycle_description: description }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setSubmitError('クライアント名は必須です')
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
            client ? `/api/clients/${client.id}` : '/api/clients',
            {
              method: client ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            }
          )

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'クライアントの保存に失敗しました')
          }

          router.push('/clients')
          router.refresh()
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'クライアントの保存に失敗しました')
      }
    })
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {client ? 'クライアント編集' : 'クライアント新規作成'}
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
        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* クライアント名 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              クライアント名 *
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
          </div>

          {/* 担当者 */}
          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              担当者
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="田中太郎"
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="info@example.com"
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              電話番号
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="03-1234-5678"
            />
          </div>

          {/* 業種 */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4 inline mr-1" />
              業種
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="建設業"
            />
          </div>
        </div>

        {/* 住所 */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            住所
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="東京都○○区○○1-2-3"
          />
        </div>

        {/* 入金サイクル設定 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">入金サイクル設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 入金サイクルタイプ */}
            <div>
              <label htmlFor="payment_cycle_type" className="block text-sm font-medium text-gray-700 mb-2">
                入金サイクルタイプ
              </label>
              <select
                id="payment_cycle_type"
                name="payment_cycle_type"
                value={formData.payment_cycle_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="month_end">月末締め</option>
                <option value="specific_date">特定日締め</option>
              </select>
            </div>

            {/* 締め日 */}
            <div>
              <label htmlFor="payment_cycle_closing_day" className="block text-sm font-medium text-gray-700 mb-2">
                締め日
              </label>
              <input
                type="number"
                id="payment_cycle_closing_day"
                name="payment_cycle_closing_day"
                min="1"
                max="31"
                value={formData.payment_cycle_closing_day || ''}
                onChange={handleNumberChange}
                onBlur={updatePaymentCycleDescription}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="31"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.payment_cycle_type === 'month_end' ? '月末締めの場合は31を入力' : '1-31の範囲で入力'}
              </p>
            </div>

            {/* 支払い月オフセット */}
            <div>
              <label htmlFor="payment_cycle_payment_month_offset" className="block text-sm font-medium text-gray-700 mb-2">
                支払い月
              </label>
              <select
                id="payment_cycle_payment_month_offset"
                name="payment_cycle_payment_month_offset"
                value={formData.payment_cycle_payment_month_offset || ''}
                onChange={handleNumberChange}
                onBlur={updatePaymentCycleDescription}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>当月</option>
                <option value={1}>翌月</option>
                <option value={2}>2ヶ月後</option>
                <option value={3}>3ヶ月後</option>
              </select>
            </div>

            {/* 支払い日 */}
            <div>
              <label htmlFor="payment_cycle_payment_day" className="block text-sm font-medium text-gray-700 mb-2">
                支払い日
              </label>
              <input
                type="number"
                id="payment_cycle_closing_day"
                name="payment_cycle_payment_day"
                min="1"
                max="31"
                value={formData.payment_cycle_payment_day || ''}
                onChange={handleNumberChange}
                onBlur={updatePaymentCycleDescription}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="31"
              />
            </div>
          </div>

          {/* 入金サイクル説明 */}
          <div className="mt-4">
            <label htmlFor="payment_cycle_description" className="block text-sm font-medium text-gray-700 mb-2">
              入金サイクル説明
            </label>
            <input
              type="text"
              id="payment_cycle_description"
              name="payment_cycle_description"
              value={formData.payment_cycle_description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例：月末締め翌月末払い"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              自動生成されます。必要に応じて手動で編集してください。
            </p>
          </div>
        </div>

        {/* 備考 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            備考
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="特記事項やメモを入力してください"
          />
        </div>

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
                {client ? '更新' : '作成'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
