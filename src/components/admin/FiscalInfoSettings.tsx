'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { FiscalInfo } from '@/types/database'
import { AlertCircle, Save, Building2, Calendar } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import FiscalPeriodChangeModal from './FiscalPeriodChangeModal'

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

  const [pastYears, setPastYears] = useState<number[]>([])
  const [readonlyView, setReadonlyView] = useState<boolean>(false)
  const [rolling, setRolling] = useState<boolean>(false)
  const [showPeriodChangeModal, setShowPeriodChangeModal] = useState<boolean>(false)

  useEffect(() => {
    fetchFiscalInfo()
    fetchPastYears()
  }, [])

  const fetchFiscalInfo = async () => {
    try {
      const response = await fetch('/api/fiscal-info')
      if (response.ok) {
        const data = await response.json()
        if (data.fiscalInfo) {
          setFiscalInfo(data.fiscalInfo)
          setReadonlyView(Boolean(data.readonly))
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

  const fetchPastYears = async () => {
    try {
      const res = await fetch('/api/fiscal-info?list=years')
      if (res.ok) {
        const data = await res.json()
        setPastYears(data.years || [])
      }
    } catch (e) {
      console.error('過年度一覧取得エラー:', e)
    }
  }

  const handleSelectPastYear = async (year: number) => {
    try {
      const res = await fetch(`/api/fiscal-info?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setFiscalInfo(data.fiscalInfo)
        setReadonlyView(true)
        setMessage({ type: 'success', text: `${year}年度の閲覧モードに切り替えました（編集不可）` })
      }
    } catch (e) {
      console.error('年度切替エラー:', e)
    }
  }

  const handleBackToCurrent = async () => {
    try {
      const res = await fetch('/api/fiscal-info?clearView=1')
      if (res.ok) {
        const data = await res.json()
        setFiscalInfo(data.fiscalInfo)
        setReadonlyView(false)
        setMessage({ type: 'success', text: '現行年度の編集モードに戻しました' })
      }
    } catch (e) {
      console.error('閲覧年度解除エラー:', e)
    }
  }

  const handleRollover = async () => {
    if (readonlyView) {
      setMessage({ type: 'error', text: '過年度閲覧中は繰越できません。現行年度に戻してください。' })
      return
    }
    if (!confirm('次年度へ繰り越します。よろしいですか？')) return
    setRolling(true)
    try {
      const res = await fetch('/api/admin/fiscal/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      })
      if (res.ok) {
        const data = await res.json()
        setMessage({ type: 'success', text: `繰越完了: ${data.fromFiscalYear}→${data.toFiscalYear}（繰越総額: ${new Intl.NumberFormat('ja-JP').format(Math.round(data.totalCarryover))}円）` })
        await fetchFiscalInfo()
        await fetchPastYears()
      } else {
        const err = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: err.error || '繰越に失敗しました' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' })
    } finally {
      setRolling(false)
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
          会社の決算情報を設定します
        </p>
      </div>
      <div className="p-6 space-y-6">
        {/* 次年度へ繰越（決算月完了後に表示） */}
        {(() => {
          const fy = Number(fiscalInfo.fiscal_year || 0)
          const sm = Number(fiscalInfo.settlement_month || 0)
          const endYear = sm === 12 ? fy : fy + 1
          const endDate = fy && sm ? new Date(endYear, sm, 0) : null
          const canRollover = !!endDate && new Date() > endDate && !readonlyView
          return (
            <div className="p-4 border rounded-md bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">次年度へ繰越</p>
                  <p className="text-xs text-gray-500 mt-1">当年度の年間合計を差し引いた残額を次年度契約額として繰り越します</p>
                </div>
                <button
                  onClick={handleRollover}
                  disabled={rolling || readonlyView || !canRollover}
                  className="px-4 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {rolling ? '処理中...' : '次年度へ繰越'}
                </button>
              </div>
              {readonlyView && (
                <div className="mt-2 text-xs text-yellow-700">過年度閲覧中は実行できません。現行年度に戻してください。</div>
              )}
              {!canRollover && !readonlyView && (
                <div className="mt-2 text-xs text-gray-500">
                  決算月の終了後（{fy ? (sm === 12 ? `${fy}年12月末` : `${fy + 1}年${sm}月末`) : '期末'}）にボタンが有効になります。
                </div>
              )}
            </div>
          )
        })()}
        
        {/* 決算期変更 */}
        <div className="p-4 border rounded-md bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">決算期変更</p>
              <p className="text-xs text-gray-500 mt-1">決算期の途中変更（年度・決算月の変更）</p>
            </div>
            <button
              onClick={() => setShowPeriodChangeModal(true)}
              disabled={readonlyView}
              className="px-4 py-2 text-sm rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              決算期変更
            </button>
          </div>
          {readonlyView && (
            <div className="mt-2 text-xs text-yellow-700">過年度閲覧中は実行できません。現行年度に戻してください。</div>
          )}
        </div>
        
        {/* 過年度の閲覧切替 */}
        <div className="p-4 border rounded-md bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">過年度の閲覧</p>
              <p className="text-xs text-gray-500 mt-1">クローズ済み年度を選択して個年度データを閲覧（編集不可）</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                defaultValue=""
                onChange={(e) => { const y = Number(e.target.value); if (y) handleSelectPastYear(y) }}
              >
                <option value="">年度を選択</option>
                {pastYears.map((y) => (
                  <option key={y} value={y}>{y}年度</option>
                ))}
              </select>
              <button
                onClick={handleBackToCurrent}
                className="px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-100"
              >
                現行年度に戻す
              </button>
            </div>
          </div>
          {readonlyView && (
            <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
              現在 {fiscalInfo.fiscal_year} 年度を閲覧中です。編集はできません。
            </div>
          )}
        </div>

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
              disabled={readonlyView}
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
              disabled={readonlyView}
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
              disabled={readonlyView}
              placeholder="1"
            />
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
            disabled={readonlyView}
            placeholder="決算に関する備考を入力してください"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || readonlyView}
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
            {readonlyView && (
              <p className="text-xs text-yellow-700">この年度は閲覧のみです（編集不可）</p>
            )}
          </div>
        </div>
      </div>
      
      {/* 決算期変更モーダル */}
      <FiscalPeriodChangeModal
        isOpen={showPeriodChangeModal}
        onClose={() => setShowPeriodChangeModal(false)}
        currentFiscalYear={fiscalInfo.fiscal_year || new Date().getFullYear()}
        currentSettlementMonth={fiscalInfo.settlement_month || 3}
        onSuccess={() => {
          fetchFiscalInfo()
          setMessage({ type: 'success', text: '決算期変更が完了しました' })
        }}
      />
    </div>
  )
}
