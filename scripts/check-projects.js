const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProjects() {
  console.log('🔍 プロジェクトテーブルの確認開始...')
  
  try {
    // 全プロジェクトを取得
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, name, business_number, company_id')
      .limit(10)
    
    console.log('📋 全プロジェクト（最初の10件）:')
    allProjects?.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name} (会社ID: ${project.company_id})`)
    })
    console.log(`総数: ${allProjects?.length || 0}件`)
    
    if (allError) {
      console.error('❌ 全プロジェクト取得エラー:', allError)
    }
    
    // ユーザーテーブルを確認
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, company_id')
      .limit(5)
    
    console.log('\n👥 ユーザー（最初の5件）:')
    users?.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (会社ID: ${user.company_id})`)
    })
    
    if (usersError) {
      console.error('❌ ユーザー取得エラー:', usersError)
    }
    
    // 会社テーブルを確認
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    console.log('\n🏢 会社（最初の5件）:')
    companies?.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`)
    })
    
    if (companiesError) {
      console.error('❌ 会社取得エラー:', companiesError)
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

checkProjects()
