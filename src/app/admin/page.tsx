import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DepartmentManagement from '@/components/admin/DepartmentManagement'
import WorkManagementSettings from '@/components/admin/WorkManagementSettings'
import FiscalInfoSettings from '@/components/admin/FiscalInfoSettings'
import BankBalanceHistoryManager from '@/components/admin/BankBalanceHistoryManager'
import BudgetCategoryManagement from '@/components/admin/BudgetCategoryManagement'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Shield, Building, Settings, FileText } from 'lucide-react'

export default async function AdminPage() {

  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // セキュリティ警告を避けるため、getUser()を使用
  const { data: { user }, error: authUserError } = await supabase.auth.getUser()
  
  if (authUserError || !user) {
    redirect('/login')
  }



  // 現在のユーザーが管理者かどうか確認
  let currentUser;
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single()

    currentUser = userData;


    // 管理者権限がない場合はダッシュボードにリダイレクト
    if (!currentUser || currentUser?.role !== 'admin') {
      // superadminの場合は/super-adminにリダイレクト
      if (currentUser?.role === 'superadmin') {
        // スーパー管理者は/super-adminにリダイレクト
        redirect('/super-admin')
      }
      redirect('/dashboard')
    }

  } catch (error) {
    console.error('❌ Adminページ: 権限チェックエラー', error)
    // エラーの場合はダッシュボードにリダイレクト
    redirect('/dashboard')
  }

  // 部署一覧を取得（将来使用予定）
  await supabase
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
          {/* 決算情報設定 */}
          <div>
            <FiscalInfoSettings />
          </div>

          {/* 銀行残高履歴管理 */}
          <div>
            <BankBalanceHistoryManager />
          </div>

          {/* 工数管理設定 */}
          <div>
            <WorkManagementSettings />
          </div>

          {/* 原価科目管理 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              原価科目管理
            </h2>
            <BudgetCategoryManagement />
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

