const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function copyDepartmentsFromSampleCompany() {
  try {
    console.log('🔍 サンプル建設コンサルタント株式会社の部署をテスト会社10にコピー開始...')
    
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9' // サンプル建設コンサルタント株式会社
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678' // テスト会社10
    
    // まず、テスト会社10の既存部署を削除
    console.log('🗑️ テスト会社10の既存部署を削除中...')
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('company_id', testCompanyId)
    
    if (deleteError) {
      console.error('❌ 既存部署削除エラー:', deleteError)
      return
    }
    console.log('✅ 既存部署削除完了')
    
    // サンプル建設コンサルタント株式会社の部署を取得
    console.log('📋 サンプル建設コンサルタント株式会社の部署を取得中...')
    const { data: sampleDepartments, error: fetchError } = await supabase
      .from('departments')
      .select('name')
      .eq('company_id', sampleCompanyId)
      .order('name')
    
    if (fetchError) {
      console.error('❌ 部署取得エラー:', fetchError)
      return
    }
    
    console.log('📋 取得した部署:', sampleDepartments?.map(d => d.name))
    
    // テスト会社10に部署をコピー
    console.log('📋 テスト会社10に部署をコピー中...')
    for (const department of sampleDepartments || []) {
      console.log(`🔄 部署コピー: ${department.name}`)
      
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: department.name,
          company_id: testCompanyId
        })
        .select()
      
      if (error) {
        console.error(`❌ 部署コピーエラー (${department.name}):`, error)
      } else {
        console.log(`✅ 部署コピー完了: ${department.name}`)
      }
    }
    
    console.log('✅ サンプル建設コンサルタント株式会社の部署をテスト会社10にコピー完了！')
    
    // 結果確認
    console.log('\n📊 コピー後の部署状況:')
    const { data: testDepartments } = await supabase
      .from('departments')
      .select('name')
      .eq('company_id', testCompanyId)
      .order('name')
    
    console.log('テスト会社10の部署:')
    testDepartments?.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

copyDepartmentsFromSampleCompany()
