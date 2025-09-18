'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Company } from '@/types/database'
import CompanyList from './CompanyList'
import CompanyForm, { CompanyFormData } from './CompanyForm'
import { Building2, Plus, ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react'

interface EmailResult {
  success: boolean
  email: string
  password: string
  companyName: string
}

export default function CompanyManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(true) // プレビューのため既定で許可
  const [loading, setLoading] = useState(true)
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null)

  // スーパー管理者権限チェック
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        // 実際の認証システムを使用する場合はここでチェック
        // デモ用に常にスーパー管理者として扱う
        setIsSuperAdmin(true)
      } catch (error) {
        console.error('権限チェックエラー:', error)
        setIsSuperAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkSuperAdmin()
  }, [])

  // クエリパラメータでフォームを直接表示 (?new=1)
  useEffect(() => {
    const isNew = searchParams?.get('new')
    if (isNew && (isNew === '1' || isNew === 'true')) {
      setMode('create')
    }
  }, [searchParams])

  const handleCreate = () => {
    setSelectedCompany(null)
    setMode('create')
    setEmailResult(null) // メール結果をリセット
  }

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setMode('edit')
    setEmailResult(null) // メール結果をリセット
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedCompany(null)
    setEmailResult(null) // メール結果をリセット
  }

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      const response = await fetch(
        selectedCompany ? `/api/super-admin/companies/${selectedCompany.id}` : '/api/super-admin/companies',
        {
          method: selectedCompany ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '法人の保存に失敗しました')
      }

      const result = await response.json()
      
      // 新規作成時でメール送信が成功した場合、結果を保存
      if (!selectedCompany && result.emailSent && result.password) {
        setEmailResult({
          success: true,
          email: result.adminUser?.email || data.email || '',
          password: result.password,
          companyName: data.name
        })
        
        // 3秒後に一覧に戻る
        setTimeout(() => {
          setMode('list')
          setSelectedCompany(null)
          setEmailResult(null)
          window.location.reload()
        }, 3000)
      } else {
        // 編集時またはメール送信なしの場合は即座に一覧に戻る
        setMode('list')
        setSelectedCompany(null)
        window.location.reload()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存に失敗しました')
    }
  }

  const handleDelete = (companyId: string) => {
    // 削除成功時の処理（必要に応じて）
  }

  // メール送信結果を閉じる
  const closeEmailResult = () => {
    setEmailResult(null)
    setMode('list')
    setSelectedCompany(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">認証チェック中...</span>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">アクセス権限がありません</h2>
        <p className="text-gray-600">スーパー管理者権限が必要です。</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ホームページに戻る
        </button>
      </div>
    )
  }

  // メール送信結果表示
  if (emailResult) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">法人作成完了</h2>
          <p className="text-gray-600">メールアドレス送信が完了しました</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 mb-2">送信完了</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>法人名:</strong> {emailResult.companyName}</p>
                <p><strong>メールアドレス:</strong> {emailResult.email}</p>
                <p><strong>パスワード:</strong> <code className="bg-green-100 px-2 py-1 rounded">{emailResult.password}</code></p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">重要なお知らせ</h3>
              <p className="text-sm text-yellow-700">
                このパスワードは一時的なものです。法人担当者に初回ログイン後、必ずパスワードを変更するようお伝えください。
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={closeEmailResult}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            法人一覧に戻る
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            3秒後に自動的に法人一覧に戻ります...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {mode === 'list' ? (
        <CompanyList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      ) : (
        <CompanyForm
          company={selectedCompany}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
















