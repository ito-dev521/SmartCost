import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SalaryEntryForm from '@/components/salary/SalaryEntryForm'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function SalaryEntry() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // ユーザーの会社IDを取得
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', session.user.id)
    .single()

  if (userError || !userData) {
    console.error('ユーザー情報取得エラー:', userError)
    redirect('/login')
  }

  console.log('🏢 給与管理ページ - 会社ID:', userData.company_id)

  // 部署データを取得（会社IDでフィルタリング）
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('company_id', userData.company_id)
    .order('name')

  // ユーザーデータを取得（会社IDでフィルタリング）
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, name, department_id, company_id')
    .eq('company_id', userData.company_id)
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

  // プロジェクトデータを取得（会社IDでフィルタリング、一般管理費プロジェクトは除外）
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, name, status, created_at, updated_at, company_id, client_id')
    .eq('company_id', userData.company_id)  // 会社IDでフィルタリング
    .neq('business_number', 'IP')  // 一般管理費プロジェクトを除外（業務番号）
    .not('name', 'ilike', '%一般管理費%')  // 一般管理費プロジェクトを除外（プロジェクト名）
    .order('name')

  // プロジェクトデータを正しい形式に変換
  const projects = projectsData?.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at
  })) || []

  // 予算科目データを取得（会社IDでフィルタリング、人件費関連のみ）
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('company_id', userData.company_id)
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
