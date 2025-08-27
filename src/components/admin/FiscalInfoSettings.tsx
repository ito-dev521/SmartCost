'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { FiscalInfo } from '@/types/database'
import { AlertCircle, Save, Building2 } from 'lucide-react'

export default function FiscalInfoSettings() {
  const [fiscalInfo, setFiscalInfo] = useState<Partial<FiscalInfo>>({
    fiscal_year: new Date().getFullYear(),
    settlement_month: 3, // デフォルトで3月決算
    current_period: 1,
    bank_balance: 0,
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchFiscalInfo()
  }, [])

  const fetchFiscalInfo = async () => {
    try {
      const response = await fetch('/api/fiscal-info')
      if (response.ok) {
        const data = await response.json()
        if (data.fiscalInfo) {
          setFiscalInfo(data.fiscalInfo)
        } else if (data.message) {
          // ユーザー新規作成時のメッセージ
          setMessage({ type: 'success', text: data.message })
        }
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || '決算情報の取得に失敗しました' })
      }
    } catch (error) {
      console.error('決算情報取得エラー:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!fiscalInfo.fiscal_year || !fiscalInfo.settlement_month) {
      setMessage({ type: 'error', text: '年度と決算月は必須です' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/fiscal-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fiscalInfo),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.fiscalInfo) {
          setFiscalInfo(data.fiscalInfo)
          setMessage({ type: 'success', text: '決算情報を保存しました' })
        } else if (data.message) {
          // ユーザー新規作成時のメッセージ
          setMessage({ type: 'success', text: data.message })
          // データ再取得
          await fetchFiscalInfo()
        }
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || '保存に失敗しました' })
      }
    } catch (error) {
      console.error('決算情報保存エラー:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          決算情報設定
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          会社の決算情報と銀行残高を設定します
        </p>
      </div>
      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex">
              <AlertCircle className={`h-5 w-5 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`} />
              <div className="ml-3">
                <p className={`text-sm font-medium ${message.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="fiscal_year" className="block text-sm font-medium text-gray-700">
              年度
            </label>
            <input
              id="fiscal_year"
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={fiscalInfo.fiscal_year || ''}
              onChange={(e) => setFiscalInfo({ ...fiscalInfo, fiscal_year: parseInt(e.target.value) || 0 })}
              placeholder="2024"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settlement_month" className="block text-sm font-medium text-gray-700">
              決算月
            </label>
            <select
              id="settlement_month"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={fiscalInfo.settlement_month || ''}
              onChange={(e) => setFiscalInfo({ ...fiscalInfo, settlement_month: parseInt(e.target.value) || 1 })}
            >
              <option value="">選択してください</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="current_period" className="block text-sm font-medium text-gray-700">
              現在の期
            </label>
            <input
              id="current_period"
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={fiscalInfo.current_period || ''}
              onChange={(e) => setFiscalInfo({ ...fiscalInfo, current_period: parseInt(e.target.value) || 1 })}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bank_balance" className="block text-sm font-medium text-gray-700">
              銀行残高
            </label>
            <input
              id="bank_balance"
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={fiscalInfo.bank_balance || ''}
              onChange={(e) => setFiscalInfo({ ...fiscalInfo, bank_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
            {fiscalInfo.bank_balance && (
              <p className="text-sm text-gray-500">
                表示: {formatCurrency(fiscalInfo.bank_balance)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            備考
          </label>
          <textarea
            id="notes"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={fiscalInfo.notes || ''}
            onChange={(e) => setFiscalInfo({ ...fiscalInfo, notes: e.target.value })}
            placeholder="決算に関する備考を入力してください"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </button>
        </div>

        {/* 現在の設定の概要 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">現在の設定概要</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>年度: {fiscalInfo.fiscal_year}年</p>
            <p>決算月: {fiscalInfo.settlement_month}月</p>
            <p>現在の期: 第{fiscalInfo.current_period}期</p>
            <p>銀行残高: {formatCurrency(fiscalInfo.bank_balance || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
