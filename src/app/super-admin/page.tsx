import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CompanyManagement from '@/components/super-admin/CompanyManagement'
import SuperAdminDashboard from '@/components/super-admin/SuperAdminDashboard'
import AuditLogViewer from '@/components/super-admin/AuditLogViewer'
import MaintenanceTools from '@/components/super-admin/MaintenanceTools'
import CaddonToggle from '@/components/super-admin/CaddonToggle'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'スーパー管理者パネル | SmartCost',
  description: '全法人の管理とシステム設定',
}

export default async function SuperAdminPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // スーパー管理者チェック（users.role や super_admins テーブルで判定）
  const headersList = await headers()
  const isDevelopmentMode = headersList.get('x-development-mode') === 'true'
  const isPlaceholderSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

  if (!isDevelopmentMode && !isPlaceholderSupabase) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      let isSuperAdmin = false

      if (user?.id) {
        const { data: userRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        if (userRow?.role === 'admin') {
          isSuperAdmin = true
        }
      }

      if (!isSuperAdmin && user?.email) {
        // super_admins テーブルがある場合のフォールバック（無ければ0件）
        const { data: sa } = await supabase
          .from('super_admins')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .limit(1)
        if (Array.isArray(sa) && sa.length > 0) {
          isSuperAdmin = true
        }
      }

      if (!isSuperAdmin) {
        redirect('/dashboard')
      }
    } catch {
      // 失敗時は通して、UI側で機能はAPIガードで保護
    }
  }

  return (
    <DashboardLayout>
      {/* ダミーUI（機能未実装）: タブ切替式のスーパー管理者パネル雛形 */}
      <SuperAdminDashboard />
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CompanyManagement />
        <div className="space-y-6">
          <AuditLogViewer />
          <MaintenanceTools />
          <CaddonToggle />
        </div>
      </div>
    </DashboardLayout>
  )
}
