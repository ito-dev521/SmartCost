'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

interface DemoAccount {
  email: string
  password: string
  role: string
  name: string
  company_name?: string
}

export default function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])
  const [showDemoAccounts, setShowDemoAccounts] = useState(true)
  const supabase = createClientComponentClient()

  // デモアカウントを取得
  const fetchDemoAccounts = useCallback(async () => {
    try {
      console.log('🔍 デモアカウント取得開始')
      console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // まず全ユーザーを取得してデバッグ
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('email, name, role, company_id')
        .not('email', 'is', null)
      
      console.log('🔍 全ユーザー取得結果:', allUsers)
      if (allUsersError) {
        console.error('❌ 全ユーザー取得エラー:', allUsersError)
      }
      
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          email, 
          role, 
          name,
          company_id,
          companies (
            name
          )
        `)
        .not('email', 'is', null)
        // .not('company_id', 'is', null) // 一時的に会社ID条件を無効化
        .order('created_at', { ascending: false })
        .limit(20) // 制限を増やして管理者が追加したユーザーも含める

      if (error) {
        console.error('デモアカウント取得エラー:', error)
        console.error('エラー詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      console.log('✅ ユーザーデータ取得成功:', users)
      console.log('✅ 取得件数:', users?.length || 0)
      
      // デモアカウントとして表示するデータを整形（会社未設定のアカウントは除外）
      const demoAccountsData: DemoAccount[] = users?.map((user) => ({
        email: user.email,
        password: 'demo123', // デモ用の固定パスワード
        role: user.role,
        name: user.name || 'Demo User',
        company_name: (user as any).companies?.name || '会社未設定'
      })) || [] // 一時的に会社名フィルタを無効化

      console.log('✅ デモアカウント取得成功:', demoAccountsData)
      console.log('✅ 表示対象件数:', demoAccountsData.length)
      // データが取得できた場合のみ更新（空の場合は固定データを維持）
      if (demoAccountsData && demoAccountsData.length > 0) {
        setDemoAccounts(demoAccountsData)
      } else {
        console.log('⚠️ Supabaseからデータが取得できませんでした。固定データを使用します。')
      }
    } catch (error) {
      console.error('デモアカウント取得エラー:', error)
      // エラーが発生した場合は空の配列を設定
      setDemoAccounts([])
    }
  }, [supabase])

  // デモアカウントでのログイン
  const loginWithDemoAccount = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔐 デモログイン開始:', email)
      console.log('🔐 使用パスワード:', password)
      
      // 認証を試行（エラーハンドリングを改善）
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ デモログインエラー:', error)
        console.error('❌ エラー詳細:', {
          message: error.message,
          status: error.status,
          email: email
        })
        
        // スキーマエラーの場合は特別な処理
        if (error.message.includes('Database error querying schema')) {
          console.log('⚠️ スキーマエラーが発生しました。認証は成功している可能性があります。')
          console.log('🔍 認証データの確認:', data)
          
          // スキーマエラーでも認証が成功している場合はリダイレクト
          if (data?.user) {
            console.log('✅ ユーザー認証は成功しています:', (data.user as any).email)
            console.log('🔄 プロジェクトページにリダイレクトします...')
            window.location.href = '/projects'
            return
          } else {
            console.log('❌ 認証データが取得できませんでした')
            console.log('🔄 スキーマエラーを無視してリダイレクトを試行します...')
            // スキーマエラーの場合は強制的にリダイレクト
            window.location.href = '/projects'
            return
          }
        }
        
        // テスト会社10のユーザーに特別なメッセージ
        if (email.includes('ii-stylelab.com')) {
          alert(`テスト会社10のユーザー（${email}）のログインに失敗しました。\n\nエラー: ${error.message}\n\nこのユーザーはauth.usersテーブルに存在しない可能性があります。\n管理者に連絡してください。`)
        } else {
          alert(`ログインに失敗しました: ${error.message}`)
        }
        return
      }

      console.log('✅ デモログイン成功:', data.user?.email)
      
      // 認証成功後、直接プロジェクトページにリダイレクト
      window.location.href = '/projects'
    } catch (error) {
      console.error('デモログインエラー:', error)
      alert('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 自動取得機能は無効化

  useEffect(() => {
    // 固定データを設定（自動取得は無効）- 会社順で並び替え
    const fixedAccounts = [
      // サンプル建設コンサルタント株式会社
      {
        email: 'superadmin@example.com',
        password: 'demo123',
        role: 'admin',
        name: 'おら社長だぞ (管理者)',
        company_name: 'サンプル建設コンサルタント株式会社'
      },
      {
        email: 'saito@demo.com',
        password: 'Manager2024!@#$',
        role: 'manager',
        name: '斉藤和巳 (マネージャー)',
        company_name: 'サンプル建設コンサルタント株式会社'
      },
      {
        email: 'masafun0521@icloud.com',
        password: 'demo123',
        role: 'user',
        name: '伊藤昌徳 (一般ユーザー)',
        company_name: 'サンプル建設コンサルタント株式会社'
      },
      {
        email: 'koko@omoro.com',
        password: 'demo123',
        role: 'viewer',
        name: 'おもろー (閲覧者)',
        company_name: 'サンプル建設コンサルタント株式会社'
      },
      {
        email: 'tanaka@tarou.com',
        password: 'demo123',
        role: 'user',
        name: '田中太郎 (一般ユーザー)',
        company_name: 'サンプル建設コンサルタント株式会社'
      },
      // テスト会社10
      {
        email: 'ito.dev@ii-stylelab.com',
        password: 'demo123',
        role: 'admin',
        name: '佐々木登 (管理者)',
        company_name: 'テスト会社10'
      },
      {
        email: 'iis001@ii-stylelab.com',
        password: 'demo123',
        role: 'user',
        name: 'テスト太郎 (一般ユーザー)',
        company_name: 'テスト会社10'
      },
      {
        email: 'pro@ii-stylelab.com',
        password: 'demo123',
        role: 'viewer',
        name: '経理のプロ (閲覧者)',
        company_name: 'テスト会社10'
      },
      {
        email: 'sachiko@ii-stylelab.com',
        password: 'demo123',
        role: 'manager',
        name: 'さちこ (マネージャー)',
        company_name: 'テスト会社10'
      }
    ]
    
    console.log('🔧 固定デモアカウントを設定:', fixedAccounts.length, '件')
    setDemoAccounts(fixedAccounts)

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 AuthForm: 認証状態変更', event, session?.user?.email)
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ ログイン成功:', session.user.email)
        // ユーザーのロールを確認してリダイレクト先を決定
        void (async () => {
          try {
            const { data: userRow } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single()
            const role = userRow?.role
            if (role === 'superadmin') {
              window.location.href = '/super-admin'
            } else {
              window.location.href = '/projects'
            }
          } catch {
            window.location.href = '/projects'
          }
        })()
      }
    })

    // 現在のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthForm: 現在のセッション', session?.user?.email || 'なし')
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchDemoAccounts])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-blue-600">
            SmartCost
          </h1>
          <h2 className="mt-2 text-center text-xl font-semibold text-gray-700">
            建設原価管理システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        {/* デモアカウントセクション */}
        {demoAccounts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-yellow-800">
                🚀 登録済みユーザー（{demoAccounts.length}件）
              </h3>
              <button
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="text-xs text-yellow-600 hover:text-yellow-800"
              >
                {showDemoAccounts ? '非表示' : '表示'}
              </button>
            </div>
            
            {showDemoAccounts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* サンプル建設コンサルタント株式会社 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-1">
                    サンプル建設コンサルタント株式会社
                  </h4>
                  {demoAccounts
                    .filter(account => account.company_name === 'サンプル建設コンサルタント株式会社')
                    .map((account, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{account.name}</div>
                          <div className="text-xs text-gray-500 truncate">{account.email}</div>
                          <div className="text-xs text-blue-600 font-medium">
                            ロール: {account.role === 'superadmin' ? 'スーパー管理者' : 
                                    account.role === 'admin' ? '管理者' : 
                                    account.role === 'manager' ? 'マネージャー' :
                                    account.role === 'viewer' ? '閲覧者' : '一般ユーザー'}
                          </div>
                        </div>
                        <button
                          onClick={() => loginWithDemoAccount(account.email, account.password)}
                          disabled={loading}
                          className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        >
                          {loading ? 'ログイン中...' : 'ログイン'}
                        </button>
                      </div>
                    ))}
                </div>

                {/* テスト会社10 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-1">
                    テスト会社10
                  </h4>
                  {demoAccounts
                    .filter(account => account.company_name === 'テスト会社10')
                    .map((account, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{account.name}</div>
                          <div className="text-xs text-gray-500 truncate">{account.email}</div>
                          <div className="text-xs text-blue-600 font-medium">
                            ロール: {account.role === 'superadmin' ? 'スーパー管理者' : 
                                    account.role === 'admin' ? '管理者' : 
                                    account.role === 'manager' ? 'マネージャー' :
                                    account.role === 'viewer' ? '閲覧者' : '一般ユーザー'}
                          </div>
                        </div>
                        <button
                          onClick={() => loginWithDemoAccount(account.email, account.password)}
                          disabled={loading}
                          className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        >
                          {loading ? 'ログイン中...' : 'ログイン'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-yellow-700 mt-3">
              ※ ボタンをクリックすると自動でログインします（本番環境では削除されます）
            </p>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  button_label: 'ログイン',
                  loading_button_label: 'ログイン中...',
                  social_provider_text: '{{provider}}でログイン',
                  link_text: 'すでにアカウントをお持ちですか？ログイン',
                },
                sign_up: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  button_label: 'アカウント作成',
                  loading_button_label: 'アカウント作成中...',
                  social_provider_text: '{{provider}}でアカウント作成',
                  link_text: 'アカウントをお持ちでないですか？アカウント作成',
                },
                magic_link: {
                  email_input_label: 'メールアドレス',
                  button_label: 'マジックリンクを送信',
                  loading_button_label: '送信中...',
                  link_text: 'マジックリンクでログイン',
                },
                forgotten_password: {
                  email_label: 'メールアドレス',
                  button_label: 'パスワードリセット手順を送信',
                  loading_button_label: '送信中...',
                  link_text: 'パスワードをお忘れですか？',
                },
              },
            }}
            providers={['google', 'github']}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
          />
        </div>
      </div>
    </div>
  )
}

