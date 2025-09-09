const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteTestCompanyDepartments() {
  try {
    console.log('🔍 テスト会社10の部署を削除開始...')
    
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678' // テスト会社10
    
    // テスト会社10の部署を削除
    console.log('🗑️ テスト会社10の部署を削除中...')
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('company_id', testCompanyId)
    
    if (deleteError) {
      console.error('❌ 部署削除エラー:', deleteError)
      return
    }
    
    console.log('✅ テスト会社10の部署削除完了！')
    
    // 結果確認
    console.log('\n📊 削除後の部署状況:')
    const { data: testDepartments } = await supabase
      .from('departments')
      .select('name, company_id')
      .eq('company_id', testCompanyId)
    
    if (testDepartments && testDepartments.length > 0) {
      console.log('❌ まだ部署が残っています:')
      testDepartments.forEach(dept => {
        console.log(`  - ${dept.name}`)
      })
    } else {
      console.log('✅ テスト会社10の部署は完全に削除されました')
    }
    
    // 全体の部署状況を確認
    console.log('\n📊 全体の部署状況:')
    const { data: allDepartments } = await supabase
      .from('departments')
      .select('name, company_id')
      .order('company_id, name')
    
    const companyMap = new Map()
    allDepartments?.forEach(dept => {
      if (!companyMap.has(dept.company_id)) {
        companyMap.set(dept.company_id, [])
      }
      companyMap.get(dept.company_id).push(dept.name)
    })
    
    companyMap.forEach((departments, companyId) => {
      const companyName = companyId === '4440fcae-03f2-4b0c-8c55-e19017ce08c9' 
        ? 'サンプル建設コンサルタント株式会社' 
        : companyId === '433f167b-e456-42e9-8dcd-9bcbe96d7678'
        ? 'テスト会社10'
        : '不明'
      console.log(`${companyName}: ${departments.length}件`)
      departments.forEach(dept => {
        console.log(`  - ${dept}`)
      })
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

deleteTestCompanyDepartments()
