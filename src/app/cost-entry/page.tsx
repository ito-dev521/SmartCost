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

  // サーバーサイドでプロジェクトデータを取得（一般管理費プロジェクトのみ除外）
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, business_number, status, created_at, updated_at, client_name, contract_amount, start_date, end_date, completion_method, progress_calculation_method, company_id')
    .neq('business_number', 'IP')  // 一般管理費プロジェクトを除外（業務番号）
    .not('name', 'ilike', '%一般管理費%')  // 一般管理費プロジェクトを除外（プロジェクト名）
    .order('business_number', { ascending: true })  // 業務番号の若い順（昇順）でソート

  console.log('=== 原価入力ページのプロジェクトデータ ===')
  projects?.forEach((project, index) => {
    console.log(`プロジェクト ${index + 1}:`, {
      id: project.id,
      name: project.name,
      business_number: project.business_number,
      status: project.status,
      isCaddonSystem: project.business_number?.startsWith('C') || project.name?.includes('CADDON')
    })
  })
  console.log(`総プロジェクト数: ${projects?.length || 0}`)

  // CADDONシステムのプロジェクトが存在するかチェック
  const hasCaddonSystem = projects?.some(p => p.business_number?.startsWith('C') || p.name?.includes('CADDON'))
  console.log(`CADDONシステムプロジェクト有無: ${hasCaddonSystem ? 'あり' : 'なし'}`)

  if (!hasCaddonSystem) {
    console.log('CADDONシステムのプロジェクトが見つかりません')
    console.log('プロジェクト管理ページでCADDONシステムのプロジェクトを作成してください')
  }

  console.log('=======================================')

  // 予算科目データを取得
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .order('level, sort_order')

  // 最近の原価エントリーを取得（全件取得してフロントエンドで制御）
  const { data: costEntries } = await supabase
    .from('cost_entries')
    .select(`
      *,
      projects:project_id(name),
      budget_categories:category_id(name)
    `)
    .order('created_at', { ascending: false })

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