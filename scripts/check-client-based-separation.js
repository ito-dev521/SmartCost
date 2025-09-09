const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkClientBasedSeparation() {
  try {
    console.log('🔍 クライアントベースのデータ分離状況を確認中...')
    
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
      console.log(`  ${index + 1}. ${client.name} (会社: ${company?.name || '不明'})`)
    })
    
    // プロジェクト一覧を取得（クライアント情報付き）
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, name, business_number, company_id, client_id, client_name,
        clients (id, name, company_id)
      `)
      .order('business_number')
    
    console.log('\n📋 プロジェクト一覧（クライアント情報付き）:')
    projects?.forEach((project, index) => {
      const client = project.clients
      const projectCompany = companies?.find(c => c.id === project.company_id)
      const clientCompany = companies?.find(c => c.id === client?.company_id)
      
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
      console.log(`     プロジェクト会社: ${projectCompany?.name || '不明'} (${project.company_id})`)
      console.log(`     クライアント: ${project.client_name || '未設定'}`)
      if (client) {
        console.log(`     クライアント会社: ${clientCompany?.name || '不明'} (${client.company_id})`)
      }
      console.log('')
    })
    
    // ケセラセラ株式会社のクライアントを特定
    const keseraceraClient = clients?.find(c => c.name === 'ケセラセラ株式会社')
    if (keseraceraClient) {
      console.log(`\n🎯 ケセラセラ株式会社のクライアント情報:`)
      console.log(`   ID: ${keseraceraClient.id}`)
      console.log(`   会社ID: ${keseraceraClient.company_id}`)
      
      const keseraceraCompany = companies?.find(c => c.id === keseraceraClient.company_id)
      console.log(`   所属会社: ${keseraceraCompany?.name || '不明'}`)
      
      // ケセラセラ株式会社のプロジェクトを取得
      const keseraceraProjects = projects?.filter(p => p.client_id === keseraceraClient.id)
      console.log(`\n📋 ケセラセラ株式会社のプロジェクト (${keseraceraProjects?.length || 0}件):`)
      keseraceraProjects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
        console.log(`     プロジェクト会社ID: ${project.company_id}`)
      })
    } else {
      console.log('\n❌ ケセラセラ株式会社のクライアントが見つかりません')
    }
    
    // テスト会社10のプロジェクトを確認
    const testCompany = companies?.find(c => c.name === 'テスト会社10')
    if (testCompany) {
      console.log(`\n🏢 テスト会社10のプロジェクト (${testCompany.id}):`)
      const testCompanyProjects = projects?.filter(p => p.company_id === testCompany.id)
      testCompanyProjects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
        console.log(`     クライアント: ${project.client_name || '未設定'}`)
        console.log(`     クライアントID: ${project.client_id || '未設定'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkClientBasedSeparation()
