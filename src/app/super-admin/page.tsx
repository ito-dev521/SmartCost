import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CompanyManagement from '@/components/super-admin/CompanyManagement'
import SuperAdminDashboard from '@/components/super-admin/SuperAdminDashboard'
import AuditLogViewer from '@/components/super-admin/AuditLogViewer'
import MaintenanceTools from '@/components/super-admin/MaintenanceTools'
import CaddonToggle from '@/components/super-admin/CaddonToggle'

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

  // ダミーUIプレビューのため、スーパー管理者チェックは一時的にスキップ

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
