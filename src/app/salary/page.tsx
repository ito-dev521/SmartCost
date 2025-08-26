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

  // 部署データを取得
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name')

  // ユーザーデータを取得（結合なし）
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, name, department_id')
    .order('name')

  // エラーチェック
  if (usersError) {
    console.error('ユーザーデータ取得エラー:', usersError)
  }

  // データを正しい形式に変換
  const users = usersData?.map(user => {
    const department = departments?.find(dept => dept.id === user.department_id)
    return {
      id: user.id,
      name: user.name,
      department_id: user.department_id,
      departments: department ? { name: department.name } : null
    }
  }) || []

  // デバッグ用ログ
  console.log('取得したユーザーデータ:', usersData)
  console.log('変換後のユーザーデータ:', users)
  console.log('ユーザー取得エラー:', usersError)

  // プロジェクトデータを取得
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, name, status, created_at, updated_at')
    .order('name')

  // プロジェクトデータを正しい形式に変換
  const projects = projectsData?.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at
  })) || []

  // 予算科目データを取得（人件費関連のみ）
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .ilike('name', '%人件費%')
    .order('level, sort_order')

  return (
    <DashboardLayout>
      <PermissionGuard requiredPermission="canManageSalaries">
        <SalaryEntryForm
          initialUsers={users || []}
          initialDepartments={departments || []}
          initialProjects={projects || []}
          initialCategories={categories || []}
        />
      </PermissionGuard>
    </DashboardLayout>
  )
}
