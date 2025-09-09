const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDetailedProjectClientMapping() {
  try {
    console.log('🔍 詳細なプロジェクト-クライアントマッピングを確認中...')
    
    // 会社一覧を取得
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    console.log('🏢 会社一覧:')
    companies?.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`)
    })
    
    // クライアント一覧を取得
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company_id')
      .order('name')
    
    console.log('\n👥 クライアント一覧:')
    clients?.forEach((client, index) => {
      const company = companies?.find(c => c.id === client.company_id)
      console.log(`  ${index + 1}. ${client.name} (ID: ${client.id}, 会社: ${company?.name || '不明'})`)
    })
    
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, company_id, client_id, client_name')
      .order('business_number')
    
    console.log('\n📋 プロジェクト一覧:')
    projects?.forEach((project, index) => {
      const projectCompany = companies?.find(c => c.id === project.company_id)
      const client = clients?.find(c => c.id === project.client_id)
      const clientCompany = client ? companies?.find(c => c.id === client.company_id) : null
      
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
      console.log(`     プロジェクト会社: ${projectCompany?.name || '不明'} (${project.company_id})`)
      console.log(`     クライアント名: ${project.client_name || '未設定'}`)
      console.log(`     クライアントID: ${project.client_id || '未設定'}`)
      if (client) {
        console.log(`     クライアント会社: ${clientCompany?.name || '不明'} (${client.company_id})`)
      }
      console.log('')
    })
    
    // ケセラセラ株式会社のクライアントを特定
    const keseraceraClients = clients?.filter(c => c.name === 'ケセラセラ株式会社')
    console.log(`\n🎯 ケセラセラ株式会社のクライアント (${keseraceraClients?.length || 0}件):`)
    keseraceraClients?.forEach((client, index) => {
      const company = companies?.find(c => c.id === client.company_id)
      console.log(`  ${index + 1}. ID: ${client.id}, 会社: ${company?.name || '不明'} (${client.company_id})`)
    })
    
    // テスト会社10のプロジェクトを確認
    const testCompany = companies?.find(c => c.name === 'テスト会社10')
    if (testCompany) {
      console.log(`\n🏢 テスト会社10のプロジェクト (${testCompany.id}):`)
      const testCompanyProjects = projects?.filter(p => p.company_id === testCompany.id)
      testCompanyProjects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
        console.log(`     クライアント: ${project.client_name || '未設定'}`)
        console.log(`     クライアントID: ${project.client_id || '未設定'}`)
        
        // クライアントがケセラセラ株式会社かチェック
        if (project.client_name === 'ケセラセラ株式会社') {
          console.log(`     ✅ ケセラセラ株式会社のプロジェクト（正しい）`)
        } else {
          console.log(`     ❌ ケセラセラ株式会社以外のプロジェクト（修正が必要）`)
        }
      })
    }
    
    // サンプル建設コンサルタント株式会社のプロジェクトを確認
    const sampleCompany = companies?.find(c => c.name === 'サンプル建設コンサルタント株式会社')
    if (sampleCompany) {
      console.log(`\n🏢 サンプル建設コンサルタント株式会社のプロジェクト (${sampleCompany.id}):`)
      const sampleCompanyProjects = projects?.filter(p => p.company_id === sampleCompany.id)
      sampleCompanyProjects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
        console.log(`     クライアント: ${project.client_name || '未設定'}`)
        console.log(`     クライアントID: ${project.client_id || '未設定'}`)
        
        // クライアントがケセラセラ株式会社かチェック
        if (project.client_name === 'ケセラセラ株式会社') {
          console.log(`     ❌ ケセラセラ株式会社のプロジェクト（テスト会社10に移動が必要）`)
        } else {
          console.log(`     ✅ ケセラセラ株式会社以外のプロジェクト（正しい）`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkDetailedProjectClientMapping()
