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
  console.log('🔍 Clientsページ: 認証チェック開始')

  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.log('❌ Clientsページ: セッションなし、/loginにリダイレクト')
    redirect('/login')
  }

  // セキュリティ警告を避けるため、getUser()を使用
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.log('❌ Clientsページ: ユーザー認証失敗、/loginにリダイレクト')
    redirect('/login')
  }

  console.log('📋 Clientsページ: ユーザー認証状態', {
    userEmail: user.email,
    userId: user.id,
    emailConfirmed: user.email_confirmed_at ? 'はい' : 'いいえ'
  })

  console.log('✅ Clientsページ: 認証成功、ページ表示')
  return (
    <DashboardLayout>
      <PermissionGuard requiredPermission="canViewClients">
        <ClientManagement />
      </PermissionGuard>
    </DashboardLayout>
  )
}
