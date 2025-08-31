import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserManagement from '@/components/users/UserManagement'
import { headers } from 'next/headers'
import AdminGuard from '@/components/auth/PermissionGuard'

export default async function UsersPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 管理者権限チェックはAdminGuardコンポーネントで処理
  return (
    <DashboardLayout>
      <AdminGuard>
        <UserManagement />
      </AdminGuard>
    </DashboardLayout>
  )
}

