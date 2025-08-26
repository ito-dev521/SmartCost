import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DepartmentManagement from '@/components/admin/DepartmentManagement'
import WorkManagementSettings from '@/components/admin/WorkManagementSettings'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Shield, Building, Settings } from 'lucide-react'

export default async function AdminPage() {
  console.log('🔍 Adminページ: 認証チェック開始')

  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.log('❌ Adminページ: セッションなし、/loginにリダイレクト')
    redirect('/login')
  }

  // セキュリティ警告を避けるため、getUser()を使用
  const { data: { user }, error: authUserError } = await supabase.auth.getUser()
  
  if (authUserError || !user) {
    console.log('❌ Adminページ: ユーザー認証失敗、/loginにリダイレクト')
    redirect('/login')
  }

  console.log('📋 Adminページ: ユーザー認証状態', {
    userEmail: user.email,
    userId: user.id,
    emailConfirmed: user.email_confirmed_at ? 'はい' : 'いいえ'
  })

  console.log('🔍 Adminページ: 管理者権限チェック開始')

  // 現在のユーザーが管理者かどうか確認
  try {
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single()

    console.log('📋 Adminページ: ユーザー権限チェック結果', {
      userFound: !!currentUser,
      userRole: currentUser?.role,
      userName: currentUser?.name,
      error: userError?.message,
      errorCode: userError?.code
    })

    // 管理者権限がない場合はダッシュボードにリダイレクト
    if (!currentUser || currentUser?.role !== 'admin') {
      console.log('❌ Adminページ: 管理者権限なし、/dashboardにリダイレクト')
      console.log('   理由:', !currentUser ? 'ユーザーデータなし' : `ロール: ${currentUser?.role}`)
      redirect('/dashboard')
    }

    console.log('✅ Adminページ: 管理者権限確認、ページ表示')
  } catch (error) {
    console.error('❌ Adminページ: 権限チェックエラー', error)
    // エラーの場合はダッシュボードにリダイレクト
    console.log('⚠️ Adminページ: 権限チェックエラーのため、/dashboardにリダイレクト')
    redirect('/dashboard')
  }

  // 部署一覧を取得
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            管理者パネル
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            部署管理とシステム設定を行います
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* 工数管理設定 */}
          <div>
            <WorkManagementSettings />
          </div>

          {/* 部署管理 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5" />
              部署管理
            </h2>
            <DepartmentManagement />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

