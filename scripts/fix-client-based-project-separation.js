const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixClientBasedProjectSeparation() {
  try {
    console.log('🔍 クライアントベースのプロジェクト分離を修正開始...')
    
    // 会社IDを取得
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678' // テスト会社10
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9' // サンプル建設コンサルタント株式会社
    
    // ケセラセラ株式会社のクライアントID（テスト会社10所属）を取得
    const { data: keseraceraClient, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('name', 'ケセラセラ株式会社')
      .eq('company_id', testCompanyId)
      .single()
    
    if (clientError || !keseraceraClient) {
      console.error('❌ ケセラセラ株式会社のクライアントが見つかりません:', clientError)
      return
    }
    
    console.log('✅ ケセラセラ株式会社のクライアントID:', keseraceraClient.id)
    
    // 1. テスト会社10のプロジェクトで、ケセラセラ株式会社以外のクライアントのプロジェクトをサンプル建設コンサルタントに移動
    console.log('\n📋 テスト会社10からサンプル建設コンサルタントに移動するプロジェクト:')
    
    const { data: testCompanyProjects, error: testProjectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, client_name, client_id')
      .eq('company_id', testCompanyId)
    
    if (testProjectsError) {
      console.error('❌ テスト会社10のプロジェクト取得エラー:', testProjectsError)
      return
    }
    
    for (const project of testCompanyProjects || []) {
      // ケセラセラ株式会社のプロジェクトはそのまま残す
      if (project.client_id === keseraceraClient.id) {
        console.log(`✅ 保持: ${project.business_number} - ${project.name} (ケセラセラ株式会社)`)
        continue
      }
      
      // 一般管理費プロジェクトはそのまま残す
      if (project.business_number === 'IP' || project.name.includes('一般管理費')) {
        console.log(`✅ 保持: ${project.business_number} - ${project.name} (一般管理費)`)
        continue
      }
      
      // その他のプロジェクトをサンプル建設コンサルタントに移動
      console.log(`🔄 移動: ${project.business_number} - ${project.name} (${project.client_name || 'クライアント未設定'})`)
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ company_id: sampleCompanyId })
        .eq('id', project.id)
      
      if (updateError) {
        console.error(`❌ プロジェクト移動エラー (${project.name}):`, updateError)
      } else {
        console.log(`✅ プロジェクト移動完了: ${project.name}`)
      }
    }
    
    // 2. サンプル建設コンサルタントのプロジェクトで、ケセラセラ株式会社のプロジェクトをテスト会社10に移動
    console.log('\n📋 サンプル建設コンサルタントからテスト会社10に移動するプロジェクト:')
    
    const { data: sampleCompanyProjects, error: sampleProjectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, client_name, client_id')
      .eq('company_id', sampleCompanyId)
    
    if (sampleProjectsError) {
      console.error('❌ サンプル建設コンサルタントのプロジェクト取得エラー:', sampleProjectsError)
      return
    }
    
    for (const project of sampleCompanyProjects || []) {
      // ケセラセラ株式会社のプロジェクトをテスト会社10に移動
      if (project.client_id === keseraceraClient.id) {
        console.log(`🔄 移動: ${project.business_number} - ${project.name} (ケセラセラ株式会社)`)
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({ company_id: testCompanyId })
          .eq('id', project.id)
        
        if (updateError) {
          console.error(`❌ プロジェクト移動エラー (${project.name}):`, updateError)
        } else {
          console.log(`✅ プロジェクト移動完了: ${project.name}`)
        }
      } else {
        console.log(`✅ 保持: ${project.business_number} - ${project.name} (${project.client_name || 'クライアント未設定'})`)
      }
    }
    
    console.log('\n✅ クライアントベースのプロジェクト分離修正完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

fixClientBasedProjectSeparation()
