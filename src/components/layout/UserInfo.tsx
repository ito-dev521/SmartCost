'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { User, Building2 } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  company_id: string
  companies?: {
    id: string
    name: string
    email: string
  }
}

export default function UserInfo() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setLoading(false)
          return
        }

        // ユーザー情報を取得
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            role,
            company_id,
            companies!inner (
              id,
              name,
              email
            )
          `)
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('ユーザー情報取得エラー:', error)
          console.error('エラー詳細:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          // ユーザーが存在しない場合は、セッションをクリア
          if (error.code === 'PGRST116') {
            console.log('ユーザーが存在しません。セッションをクリアします。')
            await supabase.auth.signOut()
            window.location.href = '/login'
          }
        } else {
          console.log('✅ ユーザー情報取得成功:', userData)
          setUser(userData as any)
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error)
        console.error('エラー詳細:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [supabase])

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">ログインユーザー</span>
      </div>
      
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900 truncate">
          {user.name || user.email}
        </div>
        
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600 truncate">
            {user.companies?.name || '会社情報なし'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          ロール: {
            user.role === 'superadmin' ? 'スーパー管理者' :
            user.role === 'admin' ? '管理者' :
            user.role === 'manager' ? 'マネージャー' :
            user.role === 'user' ? '一般ユーザー' :
            user.role === 'viewer' ? '閲覧者' :
            '不明'
          }
        </div>
      </div>
    </div>
  )
}
