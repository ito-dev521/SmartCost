import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CostEntryForm from '@/components/cost/CostEntryForm'

export default async function CostEntry() {
  const supabase = createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <CostEntryForm />
    </DashboardLayout>
  )
}
