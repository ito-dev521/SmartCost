'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export default function JWTDebug() {
  const [jwtInfo, setJwtInfo] = useState<any>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getJWTInfo = async () => {
      try {
        console.log('🔍 JWTDebug: セッション取得開始')
        // セッション取得
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔍 JWTDebug: セッション結果', { session, error })
        
        if (error || !session) {
          setJwtInfo({ 
            error: 'セッションが取得できません', 
            details: error,
            debugInfo: {
              hasError: !!error,
              hasSession: !!session,
              errorMessage: error?.message
            }
          })
          return
        }

        // JWTをデコード
        const token = session.access_token
        const payload = JSON.parse(atob(token.split('.')[1]))

        setJwtInfo({
          user_id: payload.sub,
          email: payload.email,
          company_id: payload.company_id || '❌ 未設定',
          user_role: payload.user_role || '❌ 未設定',
          raw_payload: payload
        })
      } catch (error) {
        setJwtInfo({ error: 'JWTデコードエラー', details: error })
      }
    }

    getJWTInfo()
  }, [supabase])

  if (!jwtInfo) {
    return <div className="p-4 bg-gray-100">JWT情報を読み込み中...</div>
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="text-lg font-bold mb-2">🔍 JWT Debug情報</h3>
      
      {jwtInfo.error ? (
        <div className="text-red-600">
          <p>エラー: {jwtInfo.error}</p>
          <pre className="text-sm">{JSON.stringify(jwtInfo.details, null, 2)}</pre>
        </div>
      ) : (
        <div>
          <div className="mb-2">
            <strong>ユーザーID:</strong> {jwtInfo.user_id}
          </div>
          <div className="mb-2">
            <strong>メールアドレス:</strong> {jwtInfo.email}
          </div>
          <div className="mb-2">
            <strong>Company ID:</strong> {jwtInfo.company_id}
          </div>
          <div className="mb-2">
            <strong>User Role:</strong> {jwtInfo.user_role}
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Raw JWT Payload</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 overflow-auto">
              {JSON.stringify(jwtInfo.raw_payload, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
