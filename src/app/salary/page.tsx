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
  const { data: allCategories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('company_id', userData.company_id)
    .order('level, sort_order')

  // 人件費関連の科目をフィルタリング（階層構造に対応）
  const categories = allCategories?.filter(category => {
    // レベル1の大分類で人件費系を判定
    if (category.level === 1) {
      return category.name.includes('人件費') || category.name.includes('直接費')
    }
    // レベル2,3の場合は親カテゴリを確認
    if (category.level > 1 && category.parent_id) {
      const parentCategory = allCategories?.find(p => p.id === category.parent_id)
      if (parentCategory) {
        return parentCategory.name.includes('人件費') || parentCategory.name.includes('直接費')
      }
    }
    return false
  }) || []

  // デバッグ用ログ

  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="viewer">
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
