import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CaddonManagementForm from '@/components/caddon/CaddonManagementForm'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function CaddonPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 現在のユーザーの会社IDを取得
  const { data: { user } } = await supabase.auth.getUser()
  let userCompanyId = null
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    userCompanyId = userData?.company_id
  }

  // クライアントデータを取得（会社IDでフィルタリング）
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, company_id')
    .eq('company_id', userCompanyId)
    .order('name')

  // デバッグ用ログ
  console.log('CADDON管理ページ - クライアントデータ取得:', {
    userCompanyId,
    clients,
    clientsError
  })

  // プロジェクトデータを取得
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, company_id, client_id')
    .order('business_number', { ascending: true })

  // 会社スコープでプロジェクトを絞り込み
  let filteredProjects = projects || []
  if (userCompanyId) {
    const { data: clientRows } = await supabase
      .from('clients')
      .select('id, company_id')
    const clientCompanyMap = Object.fromEntries((clientRows || []).map(cr => [cr.id, cr.company_id])) as Record<string,string>
    filteredProjects = filteredProjects.filter(p => p.company_id === userCompanyId || (p.client_id && clientCompanyMap[p.client_id] === userCompanyId))
  }

  return (
    <DashboardLayout>
      <PermissionGuard requiredPermission="canManageCaddon">
        <CaddonManagementForm
          initialClients={clients || []}
          initialProjects={filteredProjects || []}
        />
      </PermissionGuard>
    </DashboardLayout>
  )
}
