import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CostEntryForm from '@/components/cost/CostEntryForm'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function CostEntry() {
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


  // サーバーサイドでプロジェクトデータを取得（会社IDでフィルタリング、一般管理費プロジェクトのみ除外）
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, business_number, status, created_at, updated_at, client_name, contract_amount, start_date, end_date, completion_method, progress_calculation_method, company_id, client_id')
    .eq('company_id', userData.company_id)  // 会社IDでフィルタリング
    .neq('business_number', 'IP')  // 一般管理費プロジェクトを除外（業務番号）
    .not('name', 'ilike', '%一般管理費%')  // 一般管理費プロジェクトを除外（プロジェクト名）
    .order('business_number', { ascending: true })  // 業務番号の若い順（昇順）でソート

  if (projectsError) {
    console.error('❌ プロジェクト取得エラー:', projectsError)
  }

  // 会社IDでフィルタリング済みなので、そのまま使用
  const filteredProjects = projects || []


  // CADDONシステムのプロジェクトが存在するかチェック
  const hasCaddonSystem = filteredProjects?.some(p => p.business_number?.startsWith('C') || p.name?.includes('CADDON'))

  if (!hasCaddonSystem) {
  }


  // 予算科目データを取得（会社IDでフィルタリング）
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('company_id', userData.company_id)
    .order('level, sort_order')

  // 最近の原価エントリーを取得（会社IDでフィルタリング）
  const { data: costEntries } = await supabase
    .from('cost_entries')
    .select(`
      *,
      projects:project_id(name),
      budget_categories:category_id(name)
    `)
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="viewer">
        <CostEntryForm 
          initialProjects={filteredProjects || []}
          initialCategories={categories || []}
          initialCostEntries={costEntries || []}
        />
      </PermissionGuard>
    </DashboardLayout>
  )
}