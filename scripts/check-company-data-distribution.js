const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCompanyDataDistribution() {
  try {
    // 会社一覧を取得
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    console.log('🏢 会社一覧:')
    companies?.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`)
    })
    
    // 各会社のプロジェクト数を確認
    for (const company of companies || []) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, business_number')
        .eq('company_id', company.id)
      
      console.log(`\n📋 ${company.name} のプロジェクト (${projects?.length || 0}件):`)
      projects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
      })
    }
    
    // 各会社の予算科目数を確認
    for (const company of companies || []) {
      const { data: categories, error: categoriesError } = await supabase
        .from('budget_categories')
        .select('id, name, level')
        .eq('company_id', company.id)
      
      console.log(`\n📋 ${company.name} の予算科目 (${categories?.length || 0}件):`)
      categories?.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (レベル${category.level})`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCompanyDataDistribution()
