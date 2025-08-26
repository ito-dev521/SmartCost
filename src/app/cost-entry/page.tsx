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

  // サーバーサイドでプロジェクトデータを取得（一般管理費プロジェクトは除外）
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, business_number, status, created_at, updated_at')
    .neq('business_number', 'IP')  // 一般管理費プロジェクトを除外（業務番号）
    .not('name', 'ilike', '%一般管理費%')  // 一般管理費プロジェクトを除外（プロジェクト名）
    .order('name')

  // 予算科目データを取得
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .order('level, sort_order')

  // 最近の原価エントリーを取得
  const { data: costEntries } = await supabase
    .from('cost_entries')
    .select(`
      *,
      projects:project_id(name),
      budget_categories:category_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <DashboardLayout>
      <CostEntryForm 
        initialProjects={projects || []}
        initialCategories={categories || []}
        initialCostEntries={costEntries || []}
      />
    </DashboardLayout>
  )
}