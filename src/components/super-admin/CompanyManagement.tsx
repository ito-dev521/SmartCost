'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Company } from '@/types/database'
import CompanyList from './CompanyList'
import CompanyForm, { CompanyFormData } from './CompanyForm'
import { Building2, Plus, ArrowLeft } from 'lucide-react'

export default function CompanyManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(true) // プレビューのため既定で許可
  const [loading, setLoading] = useState(true)

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
  }

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setMode('edit')
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedCompany(null)
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

      // 成功したら一覧に戻る
      setMode('list')
      setSelectedCompany(null)

      // ページをリロードして最新のデータを表示
      window.location.reload()
    } catch (error) {
      throw error
    }
  }

  const handleDelete = (companyId: string) => {
    // 削除成功時の処理（必要に応じて）
    console.log('法人削除:', companyId)
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
















