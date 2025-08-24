import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SalaryEntryForm from '@/components/salary/SalaryEntryForm'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function SalaryEntry() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // プロジェクトデータを取得
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, business_number, status, created_at, updated_at')
    .order('name')

  // 予算科目データを取得（人件費関連のみ）
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .where('name', 'ilike', '%人件費%')
    .order('level, sort_order')

  return (
    <DashboardLayout>
              <PermissionGuard requiredPermission="canViewCostEntries">
        <SalaryEntryForm
          initialProjects={projects || []}
          initialCategories={categories || []}
        />
      </PermissionGuard>
    </DashboardLayout>
  )
}
