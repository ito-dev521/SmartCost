import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminUserForm from '@/components/admin/AdminUserForm'
import { Users, Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 現在のユーザーが管理者かどうか確認
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/dashboard')
  }

  // 全ユーザーの一覧を取得
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              管理者パネル
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              ユーザー管理とシステム設定を行います
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ユーザー登録フォーム */}
            <div>
              <h2 className="text-lg font-semibold mb-4">新規ユーザー登録</h2>
              <AdminUserForm />
            </div>

            {/* ユーザー一覧 */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                ユーザー一覧 ({users?.length || 0}人)
              </h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users?.map((user) => (
                    <li key={user.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? '管理者' : 'ユーザー'}
                          </span>
                          <div className="text-xs text-gray-400">
                            {new Date(user.created_at).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(!users || users.length === 0) && (
                    <li className="px-6 py-8 text-center text-gray-500">
                      ユーザーがまだ登録されていません
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
