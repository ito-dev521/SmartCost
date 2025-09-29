'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { MessageSquare, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface ProjectMemo {
  id: string
  project_id: string
  content: string
  created_by_name: string
  created_by_email?: string
  created_at: string
  updated_at: string
}

interface ProjectMemosProps {
  projectId: string
}

export default function ProjectMemos({ projectId }: ProjectMemosProps) {
  const [memos, setMemos] = useState<ProjectMemo[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [newMemo, setNewMemo] = useState('')
  const [editContent, setEditContent] = useState('')
  const [userName, setUserName] = useState('匿名ユーザー')
  const [userEmail, setUserEmail] = useState('')
  const supabase = createClientComponentClient()

  // ユーザー情報を取得
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')

          // データベースからユーザー名を取得
          const { data: { session } } = await supabase.auth.getSession()
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          // まず一般ユーザーテーブルから検索
          let { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('email', user.email)
            .single()

          // 一般ユーザーで見つからない場合、スーパー管理者テーブルを検索
          if (!userData) {
            const { data: adminData } = await supabase
              .from('super_admins')
              .select('name')
              .eq('email', user.email)
              .single()
            userData = adminData
          }

          // 名前を設定
          const displayName = userData?.name ||
                             user.user_metadata?.name ||
                             user.email?.split('@')[0] ||
                             '匿名ユーザー'
          setUserName(displayName)
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error)
        setUserName('匿名ユーザー')
      }
    }
    getUserInfo()
  }, [supabase.auth, supabase])

  // メモ一覧を取得
  const fetchMemos = async () => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/projects/${projectId}/memos`, {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        setMemos(data.memos || [])
      } else {
        console.error('メモ取得エラー:', await response.text())
      }
    } catch (error) {
      console.error('メモ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemos()
  }, [projectId])

  // 新しいメモを追加
  const handleAddMemo = async () => {
    if (!newMemo.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/projects/${projectId}/memos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newMemo.trim(),
          created_by_name: userName,
          created_by_email: userEmail
        })
      })

      if (response.ok) {
        setNewMemo('')
        setShowAddForm(false)
        fetchMemos()
      } else {
        console.error('メモ作成エラー:', await response.text())
      }
    } catch (error) {
      console.error('メモ作成エラー:', error)
    }
  }

  // メモを編集
  const handleEditMemo = async (memoId: string) => {
    if (!editContent.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/projects/${projectId}/memos/${memoId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          content: editContent.trim()
        })
      })

      if (response.ok) {
        setEditingMemoId(null)
        setEditContent('')
        fetchMemos()
      } else {
        console.error('メモ更新エラー:', await response.text())
      }
    } catch (error) {
      console.error('メモ更新エラー:', error)
    }
  }

  // メモを削除
  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/projects/${projectId}/memos/${memoId}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        fetchMemos()
      } else {
        console.error('メモ削除エラー:', await response.text())
      }
    } catch (error) {
      console.error('メモ削除エラー:', error)
    }
  }

  const startEdit = (memo: ProjectMemo) => {
    setEditingMemoId(memo.id)
    setEditContent(memo.content)
  }

  const cancelEdit = () => {
    setEditingMemoId(null)
    setEditContent('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">メモ</h3>
          <span className="ml-2 text-sm text-gray-500">({memos.length}件)</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          メモを追加
        </button>
      </div>

      {/* 新規メモ入力フォーム */}
      {showAddForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <textarea
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            placeholder="メモを入力してください..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewMemo('')
              }}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddMemo}
              disabled={!newMemo.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {/* メモ一覧 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-500">読み込み中...</div>
          </div>
        ) : memos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            メモがありません
          </div>
        ) : (
          memos.map((memo) => (
            <div key={memo.id} className="p-4 border border-gray-200 rounded-lg bg-white">
              {editingMemoId === memo.id ? (
                // 編集モード
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-1" />
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleEditMemo(memo.id)}
                      disabled={!editContent.trim()}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                // 表示モード
                <div>
                  <div className="whitespace-pre-wrap text-gray-900 mb-3">{memo.content}</div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      <span className="font-medium">{memo.created_by_name}</span>
                      {memo.created_at !== memo.updated_at && (
                        <span className="ml-2">(編集済み)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>{formatDate(memo.created_at)}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(memo)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemo(memo.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}