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
      
      // 現在のユーザーを確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('ユーザー認証エラー:', userError)
        setMessage({ type: 'error', text: 'ユーザーが認証されていません。再度ログインしてください。' })
        setIsLoading(false)
        return
      }

      // 設定を取得
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'work_management_type')
        .limit(1)

      if (error) {
        console.error('設定取得エラー:', error)
        setMessage({ type: 'error', text: '設定の取得に失敗しました' })
        setIsLoading(false)
        return
      }

              // データが存在しない場合はデフォルト設定を作成
        if (!data || data.length === 0) {
          const { data: newSetting, error: createError } = await supabase
            .from('admin_settings')
            .insert([{
              setting_key: 'work_management_type',
              setting_value: 'time', // デフォルトは時間管理
              description: '作業時間の管理方法（hours: 工数管理, time: 時間管理）'
            }])
            .select()
            .single()

        if (createError) {
          console.error('デフォルト設定作成エラー:', createError)
          setMessage({ type: 'error', text: 'デフォルト設定の作成に失敗しました' })
          setIsLoading(false)
          return
        }

        setSetting(newSetting)
        setMessage({ type: 'success', text: 'デフォルト設定を作成しました' })
      } else {
        setSetting(data[0])
        setMessage(null)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('工数管理設定: エラー', error)
      setMessage({ type: 'error', text: '設定の取得に失敗しました' })
      setIsLoading(false)
    }
  }

  const handleSettingChange = (value: string) => {
    if (setting) {
      setSetting({ ...setting, setting_value: value })
      setMessage(null) // エラーメッセージをクリア
    }
  }

  const saveSetting = async () => {
    if (!setting) {
      setMessage({ type: 'error', text: '設定が読み込まれていません' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {

      const { data, error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: setting.setting_value,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id)
        .select()

      if (error) {
        console.error('設定保存エラー:', error)
        setMessage({ type: 'error', text: '設定の保存に失敗しました' })
        return
      }

      console.log('工数管理設定: 保存成功', data)
      setSetting(data[0])
      setMessage({ type: 'success', text: '設定を保存しました' })
    } catch (error) {
      console.error('工数管理設定: 保存エラー', error)
      setMessage({ type: 'error', text: '設定の保存に失敗しました' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">工数管理設定</h3>
              <p className="text-sm text-gray-500">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Settings className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">工数管理設定</h3>
            <p className="text-sm text-gray-500">
              作業時間の管理方法を設定します
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* 設定オプション */}
          <div className="space-y-4">
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
    </div>
  )
}
