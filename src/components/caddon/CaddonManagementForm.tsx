'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Save, Calendar, Building, DollarSign, AlertCircle, Monitor } from 'lucide-react'

interface Client {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface CaddonBilling {
  id?: string
  project_id: string
  client_id: string
  billing_month: string
  caddon_usage_fee: number
  initial_setup_fee: number
  support_fee: number
  total_amount: number
  billing_status: string
  notes: string
}

interface CaddonManagementFormProps {
  initialClients: Client[]
  initialProjects: Project[]
}

export default function CaddonManagementForm({
  initialClients,
  initialProjects
}: CaddonManagementFormProps) {
  const [clients] = useState<Client[]>(initialClients)
  const [projects] = useState<Project[]>(initialProjects)
  const [saving, setSaving] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CaddonBilling | null>(null)
  const [caddonBillings, setCaddonBillings] = useState<CaddonBilling[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState<string>('')
  const [newProjectClientId, setNewProjectClientId] = useState<string>('')

  // CADDONプロジェクトを特定
  const caddonProject = projects.find(p => p.name.includes('CADDON') || p.name.includes('caddon'))

  const [formData, setFormData] = useState<CaddonBilling>({
    project_id: caddonProject?.id || '',
    client_id: '',
    billing_month: new Date().toISOString().slice(0, 7),
    caddon_usage_fee: 0,
    initial_setup_fee: 0,
    support_fee: 0,
    total_amount: 0,
    billing_status: 'pending',
    notes: ''
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (caddonProject) {
      setFormData(prev => ({ ...prev, project_id: caddonProject.id }))
    }
    fetchCaddonBillings()
  }, [caddonProject])

  // CADDON請求データ一覧を取得
  const fetchCaddonBillings = async () => {
    setLoadingEntries(true)
    try {
      const { data, error } = await supabase
        .from('caddon_billing')
        .select(`
          *,
          clients!inner(name),
          projects!inner(name)
        `)
        .order('billing_month', { ascending: false })

      if (error) {
        console.error('CADDON請求データ取得エラー:', error)
        return
      }

      setCaddonBillings(data || [])
    } catch (error) {
      console.error('CADDON請求データ取得エラー:', error)
    } finally {
      setLoadingEntries(false)
    }
  }

  // 合計金額を自動計算
  useEffect(() => {
    const total = formData.caddon_usage_fee + formData.initial_setup_fee + formData.support_fee
    setFormData(prev => ({ ...prev, total_amount: total }))
  }, [formData.caddon_usage_fee, formData.initial_setup_fee, formData.support_fee])

  // CADDONプロジェクト作成処理
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProjectName || !newProjectClientId) {
      alert('必須項目を入力してください')
      return
    }

    setCreatingProject(true)
    try {
      // 現在のユーザーの会社IDを取得
      const { data: { user } } = await supabase.auth.getUser()
      let userCompanyId = null
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        userCompanyId = userData?.company_id
      }

      // プロジェクトを作成
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: newProjectName,
          client_id: newProjectClientId,
          company_id: userCompanyId,
          client_name: clients.find(c => c.id === newProjectClientId)?.name || '',
          status: 'in_progress',
          contract_amount: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null
        }])
        .select()
        .single()

      if (projectError) throw projectError

      alert('CADDONプロジェクトを作成しました')
      
      // ページをリロードしてプロジェクトを再取得
      window.location.reload()
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      
      // エラーの詳細を表示
      let errorMessage = 'プロジェクトの作成に失敗しました'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `\n\nエラー詳細: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setCreatingProject(false)
    }
  }

  // CADDONプロジェクト自動作成処理
  const handleAutoCreateProject = async () => {
    setCreatingProject(true)
    try {
      // 現在のユーザーの会社IDを取得
      const { data: { user } } = await supabase.auth.getUser()
      let userCompanyId = null
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        userCompanyId = userData?.company_id
      }

      // プロジェクトを作成（クライアントIDは後で設定）
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: 'CADDONシステム',
          client_id: null, // 後で設定
          company_id: userCompanyId,
          client_name: '',
          status: 'in_progress',
          contract_amount: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null
        }])
        .select()
        .single()

      if (projectError) throw projectError

      alert('CADDONプロジェクトを作成しました')
      
      // ページをリロードしてプロジェクトを再取得
      window.location.reload()
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      
      // エラーの詳細を表示
      let errorMessage = 'プロジェクトの作成に失敗しました'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `\n\nエラー詳細: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setCreatingProject(false)
    }
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.project_id || !formData.client_id || !formData.billing_month) {
      alert('必須項目を入力してください')
      return
    }

    setSaving(true)
    try {
      let result
      if (editingEntry?.id) {
        // 編集モード：更新
        const { data, error } = await supabase
          .from('caddon_billing')
          .update(formData)
          .eq('id', editingEntry.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // 新規作成モード：挿入
        const { data, error } = await supabase
          .from('caddon_billing')
          .insert([formData])
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      alert(editingEntry ? 'CADDON請求データを更新しました' : 'CADDON請求データを保存しました')
      
      // フォームをリセット
      setFormData({
        project_id: caddonProject?.id || '',
        client_id: '',
        billing_month: new Date().toISOString().slice(0, 7),
        caddon_usage_fee: 0,
        initial_setup_fee: 0,
        support_fee: 0,
        total_amount: 0,
        billing_status: 'pending',
        notes: ''
      })
      setEditingEntry(null)
      
      // 一覧を更新
      await fetchCaddonBillings()
    } catch (error) {
      console.error('保存エラー:', error)
      const err = (error ?? {}) as { message?: string; details?: string; hint?: string; code?: string }
      console.error('エラー詳細:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      })
      
      let errorMessage = 'データの保存に失敗しました'
      if (err?.message) {
        errorMessage += `\n\nエラー詳細: ${err.message}`
      }
      if (err?.details) {
        errorMessage += `\n\n詳細: ${err.details}`
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // 編集処理
  const handleEdit = (entry: CaddonBilling) => {
    setEditingEntry(entry)
    setFormData({
      project_id: entry.project_id,
      client_id: entry.client_id,
      billing_month: entry.billing_month,
      caddon_usage_fee: entry.caddon_usage_fee,
      initial_setup_fee: entry.initial_setup_fee || 0,
      support_fee: entry.support_fee || 0,
      total_amount: entry.total_amount,
      billing_status: entry.billing_status,
      notes: entry.notes || ''
    })
  }

  // 削除処理
  const handleDelete = async (entry: CaddonBilling) => {
    if (!confirm('このCADDON請求データを削除しますか？')) {
      return
    }

    try {
      const { error } = await supabase
        .from('caddon_billing')
        .delete()
        .eq('id', entry.id)

      if (error) throw error

      alert('CADDON請求データを削除しました')
      await fetchCaddonBillings()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setEditingEntry(null)
    setFormData({
      project_id: caddonProject?.id || '',
      client_id: '',
      billing_month: new Date().toISOString().slice(0, 7),
      caddon_usage_fee: 0,
      initial_setup_fee: 0,
      support_fee: 0,
      total_amount: 0,
      billing_status: 'pending',
      notes: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // 請求状況を日本語に変換
  const getBillingStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '未確定'
      case 'confirmed':
        return '確定済'
      case 'billed':
        return '請求済'
      default:
        return status
    }
  }

  if (!caddonProject) {
    return (
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CADDON管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            CADDONプロジェクトの月次請求を管理します
          </p>
        </div>

        {/* CADDONプロジェクト自動作成 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Monitor className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">CADDONプロジェクトの初期化</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">CADDONプロジェクトが見つかりません</p>
                <p className="mt-1">CADDON管理を開始するために、自動的にプロジェクトを作成します。</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleAutoCreateProject}
              disabled={creatingProject}
              className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
            >
              <Monitor className="h-5 w-5 mr-2" />
              {creatingProject ? 'CADDONプロジェクト作成中...' : 'CADDONプロジェクトを自動作成'}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              プロジェクト名: CADDONシステム
            </p>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">CADDONプロジェクト自動作成について：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>プロジェクト名は「CADDONシステム」で作成されます</li>
                <li>最初のクライアントは後で選択できます</li>
                <li>プロジェクト作成後、月次請求の入力が可能になります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CADDON管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          CADDONプロジェクトの月次請求を管理します
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CADDON請求入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Monitor className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                {editingEntry ? 'CADDON請求編集' : 'CADDON請求入力'}
              </h2>
            </div>
            {editingEntry && (
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                編集キャンセル
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* プロジェクト */}
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                プロジェクト
              </label>
              <input
                type="text"
                id="project_id"
                value={caddonProject.name}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                readOnly
              />
            </div>

            {/* クライアント */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                クライアント <span className="text-red-500">*</span>
              </label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">クライアントを選択してください</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 請求月 */}
            <div>
              <label htmlFor="billing_month" className="block text-sm font-medium text-gray-700">
                請求月 <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                id="billing_month"
                value={formData.billing_month}
                onChange={(e) => {
                  // YYYY-MM形式のまま保存（データベースでVARCHARとして扱う）
                  setFormData({...formData, billing_month: e.target.value})
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                例: 2025-08（年月形式）
              </p>
            </div>

            {/* CADDON利用料 */}
            <div>
              <label htmlFor="caddon_usage_fee" className="block text-sm font-medium text-gray-700">
                CADDON利用料（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="caddon_usage_fee"
                value={formData.caddon_usage_fee === 0 ? '' : formData.caddon_usage_fee.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[,\s]/g, '')
                  const parsedValue = parseInt(numericValue) || 0
                  setFormData({...formData, caddon_usage_fee: parsedValue})
                }}
                onBlur={(e) => {
                  if (formData.caddon_usage_fee > 0) {
                    e.target.value = formData.caddon_usage_fee.toLocaleString()
                  }
                }}
                onFocus={(e) => {
                  if (formData.caddon_usage_fee > 0) {
                    e.target.value = formData.caddon_usage_fee.toString()
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="150,000"
                required
              />
            </div>

            {/* 初期設定料 */}
            <div>
              <label htmlFor="initial_setup_fee" className="block text-sm font-medium text-gray-700">
                初期設定料（円）
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="initial_setup_fee"
                value={formData.initial_setup_fee === 0 ? '' : formData.initial_setup_fee.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[,\s]/g, '')
                  const parsedValue = parseInt(numericValue) || 0
                  setFormData({...formData, initial_setup_fee: parsedValue})
                }}
                onBlur={(e) => {
                  if (formData.initial_setup_fee > 0) {
                    e.target.value = formData.initial_setup_fee.toLocaleString()
                  }
                }}
                onFocus={(e) => {
                  if (formData.initial_setup_fee > 0) {
                    e.target.value = formData.initial_setup_fee.toString()
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="200,000"
              />
            </div>

            {/* サポート料 */}
            <div>
              <label htmlFor="support_fee" className="block text-sm font-medium text-gray-700">
                サポート料（円）
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="support_fee"
                value={formData.support_fee === 0 ? '' : formData.support_fee.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[,\s]/g, '')
                  const parsedValue = parseInt(numericValue) || 0
                  setFormData({...formData, support_fee: parsedValue})
                }}
                onBlur={(e) => {
                  if (formData.support_fee > 0) {
                    e.target.value = formData.support_fee.toLocaleString()
                  }
                }}
                onFocus={(e) => {
                  if (formData.support_fee > 0) {
                    e.target.value = formData.support_fee.toString()
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="50,000"
              />
            </div>

            {/* 合計金額（自動計算） */}
            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                合計金額
              </label>
              <input
                type="text"
                id="total_amount"
                value={formatCurrency(formData.total_amount)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                readOnly
              />
            </div>

            {/* 請求状況 */}
            <div>
              <label htmlFor="billing_status" className="block text-sm font-medium text-gray-700">
                請求状況
              </label>
              <select
                id="billing_status"
                value={formData.billing_status}
                onChange={(e) => setFormData({...formData, billing_status: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">未確定</option>
                <option value="confirmed">確定済</option>
                <option value="billed">請求済</option>
              </select>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="特記事項があれば入力してください"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : (editingEntry ? '更新' : '保存')}
              </button>
            </div>
          </form>
        </div>

        {/* CADDON請求一覧 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">CADDON請求一覧</h2>
            </div>
            <button
              onClick={fetchCaddonBillings}
              disabled={loadingEntries}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loadingEntries ? '更新中...' : '更新'}
            </button>
          </div>

          {loadingEntries ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">データを読み込み中...</p>
            </div>
          ) : caddonBillings.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">CADDON請求データがありません</p>
              <p className="text-xs text-gray-400">CADDON請求を入力すると、ここに表示されます</p>
            </div>
          ) : (
            <div className="space-y-3">
              {caddonBillings.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {clients.find(c => c.id === entry.client_id)?.name || '不明'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.billing_month} | CADDON: {formatCurrency(entry.caddon_usage_fee)} | 初期設定: {formatCurrency(entry.initial_setup_fee || 0)} | サポート: {formatCurrency(entry.support_fee || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        合計: {formatCurrency(entry.total_amount)} | 状況: {getBillingStatusText(entry.billing_status)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        disabled={editingEntry}
                        className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        disabled={editingEntry}
                        className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">CADDON管理の流れ：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>クライアントと請求月を選択してください</li>
              <li>CADDON利用料とサポート料を入力してください</li>
              <li>合計金額は自動計算されます</li>
              <li>請求状況を設定して保存してください</li>
            </ol>
            <p className="mt-2 text-xs">
              ※ CADDON請求データは分析・レポートで収益分析に活用されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
