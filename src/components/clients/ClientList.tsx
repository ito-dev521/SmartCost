'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Client } from '@/types/database'
import { Building2, Phone, MapPin, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase'

interface ClientListProps {
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
  onCreateNew?: () => void
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export default function ClientList({ onEdit, onDelete, onCreateNew, canCreate = false, canEdit = false, canDelete = false }: ClientListProps) {
  console.log('🔍 ClientList: 権限状態:', { canCreate, canEdit, canDelete })
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  // クライアント一覧を取得
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)

        // Supabaseクライアントからセッションを取得
        const { data: { session } } = await supabase.auth.getSession()

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const companyId = searchParams?.get('companyId') || ''
        const endpoint = `/api/clients${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''}`
        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'クライアントの取得に失敗しました')
        }

        const data = await response.json()
        setClients(data.clients || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : 'クライアントの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [searchParams])

  // 検索フィルター
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (clientId: string, clientName: string) => {
    console.log('🔍 ClientList: handleDelete呼び出し:', { clientId, clientName })
    
    // 削除確認
    if (!confirm(`${clientName}を削除しますか？この操作は取り消せません。`)) {
      console.log('❌ ClientList: 削除キャンセル')
      return
    }

    console.log('✅ ClientList: 削除確認完了')

    // 親コンポーネントのonDeleteコールバックを呼び出し
    if (onDelete) {
      console.log('📋 ClientList: 親コンポーネントのonDeleteを呼び出し')
      console.log('📋 ClientList: onDelete関数の型:', typeof onDelete)
      console.log('📋 ClientList: onDelete関数の内容:', onDelete.toString())
      
      try {
        console.log('🔍 ClientList: onDelete関数を実行中...')
        onDelete(clientId)
        console.log('✅ ClientList: onDelete呼び出し完了')
        console.log('🎉 ClientList: 削除処理完了')
      } catch (error) {
        console.error('❌ ClientList: onDelete呼び出しエラー:', error)
      }
    } else {
      console.log('⚠️ ClientList: onDeleteプロパティが存在しない、フォールバック処理を実行')
      // フォールバック: 直接削除処理を実行
      try {
        console.log('🔍 ClientList: フォールバック削除処理開始:', clientId)

        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'クライアントの削除に失敗しました')
        }

        console.log('✅ ClientList: フォールバック削除処理成功')

        // ローカル状態を更新
        setClients(prev => prev.filter(client => client.id !== clientId))
      } catch (error) {
        console.error('❌ ClientList: フォールバック削除処理エラー:', error)
        alert(error instanceof Error ? error.message : 'クライアントの削除に失敗しました')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">クライアントを読み込み中...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">クライアント管理</h2>
          <p className="text-gray-600 mt-1">クライアント情報の登録・編集・削除</p>
        </div>
        {canCreate && clients.length > 0 && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規クライアント
          </button>
        )}
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                  type="text"
                  placeholder="クライアント名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">総クライアント数</p>
              <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* クライアント一覧 */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? '検索結果がありません' : 'クライアントが登録されていません'}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? '検索条件を変更して再度お試しください'
              : '新規クライアントを作成して、プロジェクト管理を始めましょう'
            }
          </p>
          {canCreate && !searchTerm && (
            <button
              onClick={onCreateNew}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規クライアントを作成
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {client.name}
                    </h3>
                  </div>
                  <div className="flex space-x-1">
                    {canEdit && (
                      <button
                        onClick={() => onEdit ? onEdit(client) : router.push(`/clients/${client.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          console.log('🔍 ClientList: 削除ボタンクリック:', { clientId: client.id, clientName: client.name })
                          handleDelete(client.id, client.name)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {!canDelete && (
                      <div className="p-1 text-gray-300">
                        <Trash2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>



                {/* 電話 */}
                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}



                {/* 住所 */}
                {client.address && (
                  <div className="flex items-start text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                )}

                {/* 入金サイクル */}
                {client.payment_cycle_description && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-medium">入金サイクル:</span>
                    </div>
                    <p className="line-clamp-2">{client.payment_cycle_description}</p>
                  </div>
                )}

                {/* 備考 */}
                {client.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <p className="line-clamp-3">{client.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
