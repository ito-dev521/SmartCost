import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CashFlowDashboard from '@/components/cash-flow/CashFlowDashboard'

export default async function CashFlow() {
  const supabase = createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <CashFlowDashboard />
    </DashboardLayout>
  )
}
