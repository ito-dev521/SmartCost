'use client'

import { useState, useEffect } from 'react'
import { CompanyWithCounts } from '@/types/database'
import { Building2, Users, Briefcase, FolderOpen, Plus, Search, Edit, Trash2 } from 'lucide-react'

interface CompanyListProps {
  onEdit?: (company: CompanyWithCounts) => void
  onDelete?: (companyId: string) => void
  onCreate?: () => void
}

export default function CompanyList({ onEdit, onDelete, onCreate }: CompanyListProps) {
  const [companies, setCompanies] = useState<CompanyWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 法人一覧を取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/super-admin/companies')

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '法人の取得に失敗しました')
        }

        const data = await response.json()
        
        // CADDON設定の値を確認
        
        setCompanies(data.companies || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : '法人の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // 検索フィルター
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (companyId: string, companyName: string) => {
    if (!confirm(`${companyName}を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '法人の削除に失敗しました')
      }

      // リストから削除
      setCompanies(prev => prev.filter(company => company.id !== companyId))

      if (onDelete) {
        onDelete(companyId)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '法人の削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">法人を読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">スーパー管理者パネル</h2>
          <p className="text-gray-600 mt-1">全法人の管理とシステム設定</p>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規法人登録
          </button>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">総法人数</p>
              <p className="text-2xl font-bold text-blue-900">{companies.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">総ユーザー数</p>
              <p className="text-2xl font-bold text-green-900">
                {companies.reduce((sum, company) => sum + (((company as any)._counts?.users) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">総クライアント数</p>
              <p className="text-2xl font-bold text-purple-900">
                {companies.reduce((sum, company) => sum + (((company as any)._counts?.clients) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FolderOpen className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-600">総プロジェクト数</p>
              <p className="text-2xl font-bold text-orange-900">
                {companies.reduce((sum, company) => sum + (((company as any)._counts?.projects) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="法人名で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 法人一覧 */}
      {filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? '検索結果がありません' : '登録されている法人はありません'}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? '検索条件を変更して再度お試しください'
              : '新しい法人を登録して、システムの利用を開始しましょう'
            }
          </p>
          {onCreate && !searchTerm && (
            <button
              onClick={onCreate}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              最初の法人を登録
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => window.location.assign(`/super-admin/companies/${company.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.assign(`/super-admin/companies/${company.id}`) } }}
              aria-label={`法人「${company.name}」の詳細を表示`}
            >
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center min-w-0 flex-1">
                    <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate" title={company.name}>
                      <span className="truncate inline-block max-w-full">{company.name}</span>
                    </h3>
                  </div>
                  <div className="flex space-x-1">
                    {onEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(company) }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(company.id, company.name) }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 統計情報 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ユーザー数</span>
                    <span className="font-medium text-gray-900">
                      {((company as any)._counts?.users) || 0}人
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">クライアント数</span>
                    <span className="font-medium text-gray-900">
                      {((company as any)._counts?.clients) || 0}社
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">プロジェクト数</span>
                    <span className="font-medium text-gray-900">
                      {((company as any)._counts?.projects) || 0}件
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CADDON</span>
                    <span className={`font-medium ${(company.company_settings?.caddon_enabled ?? true) ? 'text-teal-700' : 'text-gray-500'}`}>
                      {(company.company_settings?.caddon_enabled ?? true) ? '有効' : '無効'}
                    </span>
                  </div>
                </div>

                {/* 作成日 */}
                <div className="text-xs text-gray-500">
                  作成日: {new Date(company.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


