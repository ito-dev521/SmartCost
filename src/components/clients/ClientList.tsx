'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Client } from '@/types/database'
import { Building2, User, Mail, Phone, MapPin, Briefcase, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { usePermissions } from '@/lib/permissions'
import { createClientComponentClient } from '@/lib/supabase'

interface ClientListProps {
  onEdit?: (client: Client) => void
  onDelete?: (clientId: string) => void
}

export default function ClientList({ onEdit, onDelete }: ClientListProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [permissions, setPermissions] = useState<any>(null)
  const supabase = createClientComponentClient()

  // 権限チェック
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // 実際のユーザーセッションからIDを取得
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const perms = await usePermissions(session.user.id)
          setPermissions(perms)
        } else {
          console.warn('認証セッションなし - 権限チェックをスキップ')
          setPermissions(null)
        }
      } catch (error) {
        console.error('権限チェックエラー:', error)
        setPermissions(null)
      }
    }
    checkPermissions()
  }, [])

  // クライアント一覧を取得
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)

        // Supabaseクライアントからセッションを取得
        const { data: { session } } = await supabase.auth.getSession()

        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }

        const response = await fetch('/api/clients', {
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
  }, [])

  // 検索フィルター
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact_person && client.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.industry && client.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`${clientName}を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'クライアントの削除に失敗しました')
      }

      // リストから削除
      setClients(prev => prev.filter(client => client.id !== clientId))

      if (onDelete) {
        onDelete(clientId)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'クライアントの削除に失敗しました')
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
        {permissions?.isManager && (
          <button
            onClick={() => router.push('/clients/new')}
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
          placeholder="クライアント名、担当者、業種で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">総クライアント数</p>
              <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">担当者登録数</p>
              <p className="text-2xl font-bold text-green-900">
                {clients.filter(c => c.contact_person).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">業種別</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Set(clients.filter(c => c.industry).map(c => c.industry)).size}
              </p>
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
          {permissions?.isManager && !searchTerm && (
            <button
              onClick={() => router.push('/clients/new')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              最初のクライアントを作成
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
                    {permissions?.canEditClients && (
                      <button
                        onClick={() => onEdit ? onEdit(client) : router.push(`/clients/${client.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {permissions?.canDeleteClients && (
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 担当者 */}
                {client.contact_person && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    <span>{client.contact_person}</span>
                  </div>
                )}

                {/* メール */}
                {client.email && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}

                {/* 電話 */}
                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}

                {/* 業種 */}
                {client.industry && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{client.industry}</span>
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
