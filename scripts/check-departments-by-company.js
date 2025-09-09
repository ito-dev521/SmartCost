const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDepartmentsByCompany() {
  try {
    console.log('🔍 会社別部署データを確認中...')
    
    // 会社一覧を取得
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    console.log('🏢 会社一覧:')
    companies?.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`)
    })
    
    // 部署一覧を取得
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('id, name, company_id')
      .order('name')
    
    console.log('\n👥 部署一覧:')
    departments?.forEach((department, index) => {
      const company = companies?.find(c => c.id === department.company_id)
      console.log(`  ${index + 1}. ${department.name} (会社: ${company?.name || '不明'})`)
    })
    
    // 各会社の部署数を確認
    console.log('\n📊 会社別部署数:')
    for (const company of companies || []) {
      const companyDepartments = departments?.filter(d => d.company_id === company.id) || []
      console.log(`  ${company.name}: ${companyDepartments.length}件`)
      companyDepartments.forEach(dept => {
        console.log(`    - ${dept.name}`)
      })
    }
    
    // 現在のユーザー（ito.dev@ii-stylelab.com）の会社の部署を確認
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, company_id')
      .eq('email', 'ito.dev@ii-stylelab.com')
      .single()
    
    if (currentUser && !userError) {
      console.log(`\n👤 現在のユーザー: ${currentUser.email} (${currentUser.name})`)
      console.log(`🏢 所属会社ID: ${currentUser.company_id}`)
      
      const userCompany = companies?.find(c => c.id === currentUser.company_id)
      console.log(`🏢 所属会社名: ${userCompany?.name || '不明'}`)
      
      const userDepartments = departments?.filter(d => d.company_id === currentUser.company_id) || []
      console.log(`👥 利用可能な部署: ${userDepartments.length}件`)
      userDepartments.forEach(dept => {
        console.log(`    - ${dept.name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkDepartmentsByCompany()
