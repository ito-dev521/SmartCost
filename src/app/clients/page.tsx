import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ClientManagement from '@/components/clients/ClientManagement'
import { headers } from 'next/headers'

import PermissionGuard from '@/components/auth/PermissionGuard'

export const metadata: Metadata = {
  title: 'クライアント管理 | SmartCost',
  description: 'クライアント情報の管理',
}

export default async function ClientsPage() {

  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // セキュリティ警告を避けるため、getUser()を使用
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }


  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="user">
        <ClientManagement />
      </PermissionGuard>
    </DashboardLayout>
  )
}
