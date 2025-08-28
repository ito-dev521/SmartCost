'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface AdminSetting {
  id: string
  setting_key: string
  setting_value: string
  description: string
}

export default function WorkManagementSettings() {
  const [setting, setSetting] = useState<AdminSetting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchSetting()
  }, [])

  const fetchSetting = async () => {
    try {
      // まず現在のユーザーを確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (process.env.NODE_ENV === 'development') {
        console.log('現在のユーザー:', user)
        console.log('ユーザーエラー:', userError)
      }

      if (userError || !user) {
        console.error('ユーザー認証エラー:', userError)
        setMessage({ type: 'error', text: 'ユーザーが認証されていません。再度ログインしてください。' })
        setIsLoading(false)
        return
      }

      // 設定を取得（スーパー管理者権限の確認はポリシーで自動的に行われる）
      if (process.env.NODE_ENV === 'development') {
        console.log('設定取得開始...')
      }
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'work_management_type')
        .limit(1)

      if (process.env.NODE_ENV === 'development') {
        console.log('Supabaseレスポンス:', { data, error })
      }

      if (error) {
        console.error('設定取得エラー:', error)
        console.error('エラーコード:', error.code)
        console.error('エラーメッセージ:', error.message)

        // RLSポリシーによるアクセス拒否の場合
        if (error.code === 'PGRST116' || error.message?.includes('permission')) {
          setMessage({
            type: 'error',
            text: 'スーパー管理者権限が必要です。この機能を使用するにはスーパー管理者権限が必要です。'
          })
        } else {
          setMessage({ type: 'error', text: '設定の取得に失敗しました' })
        }
        setIsLoading(false)
        return
      }

      // データが空の場合
      if (!data || data.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('設定データが見つからないため、エラーメッセージを表示')
        }
        setSetting(null) // 明示的にnullに設定
        setMessage({
          type: 'error',
          text: '設定データが見つからないため、デフォルト設定を使用します。'
        })
        setIsLoading(false)
        return
      }

      // 最初のレコードを使用
      const settingData = data[0]
      if (process.env.NODE_ENV === 'development') {
        console.log('設定取得成功:', settingData)
      }
      setSetting(settingData)
      setMessage(null) // エラーが解決されたらメッセージをクリア
    } catch (error) {
      console.error('設定取得例外:', error)
      setMessage({ type: 'error', text: '設定の取得に失敗しました' })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSetting = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('saveSetting開始 - 現在のsetting状態:', setting)
    }
    
    if (!setting) {
      console.error('設定がnullです')
      setMessage({ type: 'error', text: '設定が読み込まれていません。ページを再読み込みしてください。' })
      return
    }

    // IDが有効なUUIDかチェック
    if (!setting.id || setting.id === 'default' || typeof setting.id !== 'string' || setting.id.length < 30) {
      console.error('無効な設定ID:', setting.id)
      setMessage({ type: 'error', text: '設定IDが無効です。ページを再読み込みしてください。' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // 現在のユーザーを再度確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (process.env.NODE_ENV === 'development') {
        console.log('現在のユーザー情報:', {
          user: user ? { id: user.id, email: user.email } : null,
          userError
        })
      }

      if (userError || !user) {
        setMessage({ type: 'error', text: 'ユーザーが認証されていません。再度ログインしてください。' })
        return
      }

      // 設定の保存（既存レコードを更新）
      if (process.env.NODE_ENV === 'development') {
        console.log('設定保存開始:', {
          setting,
          settingId: setting.id,
        newValue: setting.setting_value
      })

      // まず現在のデータを確認
      if (process.env.NODE_ENV === 'development') {
        console.log('現在のデータを確認...')
      }
      const { data: currentData, error: fetchError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', setting.id)
        .single()

      if (process.env.NODE_ENV === 'development') {
        console.log('現在のデータ確認結果:', {
          currentData,
          fetchError
      })

      // 既存設定の場合、更新
      if (process.env.NODE_ENV === 'development') {
        console.log('既存設定更新開始...', setting.id)
      }
      const updateData = {
        setting_value: setting.setting_value,
        updated_at: new Date().toISOString()
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('更新データ:', updateData)
      }

      const result = await supabase
        .from('admin_settings')
        .update(updateData)
        .eq('id', setting.id)

      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase update result:', {
          data: result.data,
          error: result.error,
          status: result.status,
          statusText: result.statusText
        })
      }

      const { error } = result

      if (error) {
        console.error('設定保存エラー:', error)
        console.error('エラーコード:', error.code)
        console.error('エラーメッセージ:', error.message)

        // RLSポリシーによるアクセス拒否の場合
        if (error.code === 'PGRST116' || error.message?.includes('permission')) {
          setMessage({
            type: 'error',
            text: 'スーパー管理者権限が必要です。この機能を使用するにはスーパー管理者権限が必要です。'
          })
        } else {
          setMessage({ type: 'error', text: '設定の保存に失敗しました' })
        }
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('設定保存成功:', result.data)
      }

      // 保存成功後、ローカルの状態を更新
      setSetting({
        ...setting,
        setting_value: setting.setting_value,
        updated_at: new Date().toISOString()
      })

      setMessage({ type: 'success', text: '設定が保存されました' })
    } catch (error) {
      console.error('設定保存例外:', error)
      setMessage({ type: 'error', text: '設定の保存に失敗しました' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (value: string) => {
    if (setting) {
      setSetting({ ...setting, setting_value: value })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // 設定が読み込まれていない場合
  if (!setting) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">工数管理設定</h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                設定の読み込みに失敗しました
              </h3>
              <p className="mt-2 text-sm text-red-700">
                設定データが読み込まれていません。ページを再読み込みするか、管理者に連絡してください。
              </p>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`rounded-md p-4 mt-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">工数管理設定</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            工数管理タイプ
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="hours"
                name="workType"
                value="hours"
                checked={setting?.setting_value === 'hours'}
                onChange={(e) => handleSettingChange(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="hours" className="ml-2 text-sm text-gray-700">
                <strong>工数管理</strong>
                <span className="block text-xs text-gray-500 mt-1">
                  1日1.0人工の固定工数で管理します（従来の方式）
                </span>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="time"
                name="workType"
                value="time"
                checked={setting?.setting_value === 'time'}
                onChange={(e) => handleSettingChange(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="time" className="ml-2 text-sm text-gray-700">
                <strong>時間管理</strong>
                <span className="block text-xs text-gray-500 mt-1">
                  実際の労働時間で管理し、時給単価を計算して人件費を算出します
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 現在の設定の説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                現在の設定: {setting?.setting_value === 'hours' ? '工数管理' : '時間管理'}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {setting?.setting_value === 'hours' ? (
                  <p>
                    作業日報では1.0人工の固定工数を入力します。プロジェクト毎の工数集計が行われます。
                  </p>
                ) : (
                  <p>
                    作業日報では実際の労働時間を入力します。給与総額を総時間で割った時給単価を計算し、
                    各プロジェクトの人件費を算出します。
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={saveSetting}
            disabled={isSaving || !setting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
