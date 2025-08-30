'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  History,
} from 'lucide-react'

interface BankBalanceHistory {
  id: string
  fiscal_year: number
  balance_date: string
  opening_balance: number
  closing_balance: number
  total_income: number
  total_expense: number
  transaction_count: number
  created_at: string
  updated_at: string
}

export default function BankBalanceHistoryManager() {
  const [history, setHistory] = useState<BankBalanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BankBalanceHistory | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<Partial<BankBalanceHistory>>({
    fiscal_year: new Date().getFullYear(),
    balance_date: new Date().toISOString().substring(0, 7) + '-01',
    opening_balance: 0,
    closing_balance: 0,
    total_income: 0,
    total_expense: 0,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/bank-balance-history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      } else {
        setMessage({ type: 'error', text: '履歴データの取得に失敗しました' })
      }
    } catch (error) {
      console.error('履歴取得エラー:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.fiscal_year || !formData.balance_date || !formData.opening_balance) {
      setMessage({ type: 'error', text: '年度、年月、月初残高は必須です' })
      return
    }

    // 重複チェック（編集時は除外）
    if (!editing) {
      const monthYear = formData.balance_date.substring(0, 7) // 年月のみ（例：2025-08）
      const isDuplicate = history.some(record => {
        const recordMonthYear = record.balance_date.substring(0, 7) // 年月のみ
        return recordMonthYear === monthYear
      })

      if (isDuplicate) {
        setMessage({ type: 'error', text: '同じ年月のデータは既に存在します' })
        return
      }
    }

    setSaving(true)
    setMessage(null)

    try {
      const method = editing ? 'PUT' : 'POST'
      // total_expenseは自動計算されるため、送信しない
      const { total_expense, ...dataToSend } = formData
      const body = editing ? { ...dataToSend, id: editing.id } : dataToSend

      const response = await fetch('/api/bank-balance-history', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        await fetchHistory()
        handleCancel()
      } else {
        const error = await response.json()
        let errorMessage = error.error || '保存に失敗しました'
        
        // 詳細なエラー情報がある場合は追加
        if (error.details) {
          errorMessage += ` (詳細: ${error.details})`
        }
        if (error.monthYear) {
          errorMessage += ` (対象年月: ${error.monthYear})`
        }
        
        setMessage({ type: 'error', text: errorMessage })
      }
    } catch (error) {
      console.error('保存エラー:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (record: BankBalanceHistory) => {
    setEditing(record)
    setFormData(record)
  }

  const handleAdd = () => {
    setIsAdding(true)
    setFormData({
      fiscal_year: new Date().getFullYear(),
      balance_date: new Date().toISOString().substring(0, 7) + '-01',
      opening_balance: 0,
      closing_balance: 0,
      total_income: 0,
      total_expense: 0,
    })
  }

  const handleCancel = () => {
    setEditing(null)
    setIsAdding(false)
    setFormData({})
    setMessage(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この履歴データを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/bank-balance-history?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        await fetchHistory()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || '削除に失敗しました' })
      }
    } catch (error) {
      console.error('削除エラー:', error)
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
    })
  }

  const formatNumberInput = (value: number | undefined): string => {
    if (value === undefined || value === null) return ''
    return value.toLocaleString('ja-JP')
  }

  const parseNumberInput = (value: string): number => {
    if (!value) return 0
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  const calculateTotalExpense = (): number => {
    const openingBalance = formData.opening_balance || 0
    const totalIncome = formData.total_income || 0
    const closingBalance = formData.closing_balance || 0
    return openingBalance + totalIncome - closingBalance
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">銀行残高履歴管理</h3>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規追加
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          銀行残高の履歴データを管理します。過去の残高変動パターンを蓄積することで、
          AI分析の精度が大幅に向上し、より正確な収支予測や資金計画の立案が可能になります。
        </p>
      </div>

      <div className="p-6">
        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <X className={`h-5 w-5 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${message.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* フォーム（追加・編集時） */}
        {(isAdding || editing) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              {editing ? '履歴データの編集' : '新規履歴データの追加'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">年度</label>
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fiscal_year || ''}
                  onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">年月</label>
                <input
                  type="month"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.balance_date ? formData.balance_date.substring(0, 7) : ''}
                  onChange={(e) => setFormData({ ...formData, balance_date: e.target.value + '-01' })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">月初残高</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formatNumberInput(formData.opening_balance)}
                  onChange={(e) => setFormData({ ...formData, opening_balance: parseNumberInput(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">月末残高</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formatNumberInput(formData.closing_balance)}
                  onChange={(e) => setFormData({ ...formData, closing_balance: parseNumberInput(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">総収入</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formatNumberInput(formData.total_income)}
                  onChange={(e) => setFormData({ ...formData, total_income: parseNumberInput(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">総支出（自動計算）</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  value={formatNumberInput(calculateTotalExpense())}
                  readOnly
                  placeholder="自動計算"
                />
                <p className="mt-1 text-xs text-gray-500">
                  月初残高 + 総収入 - 月末残高で自動計算されます
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
          </div>
        )}

        {/* 履歴データテーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年月
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月初残高
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月末残高
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  収入
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支出
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    履歴データがありません
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.fiscal_year}年{new Date(record.balance_date).getMonth() + 1}月
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.fiscal_year}年
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.opening_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.closing_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{formatCurrency(record.total_income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(record.total_expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
