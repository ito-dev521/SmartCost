import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { BarChart3 } from 'lucide-react'

export default async function Analytics() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }


  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="viewer">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">分析・レポート</h1>
              <p className="text-sm text-gray-600">プロジェクトの分析と詳細なレポートを表示します</p>
            </div>
          </div>

          <AnalyticsDashboard />
        </div>
      </PermissionGuard>
    </DashboardLayout>
  )
}

