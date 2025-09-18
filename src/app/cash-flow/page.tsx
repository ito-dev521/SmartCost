import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CashFlowDashboard from '@/components/cash-flow/CashFlowDashboard'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function CashFlow() {
  const supabase = createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="admin">
        <CashFlowDashboard />
      </PermissionGuard>
    </DashboardLayout>
  )
}
