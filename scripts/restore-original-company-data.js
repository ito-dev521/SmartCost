const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function restoreOriginalCompanyData() {
  try {
    console.log('🔍 元の会社データを復元開始...')
    
    // サンプル建設コンサルタント株式会社のID
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    // テスト会社10のID
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678'
    
    // 元々サンプル建設コンサルタント株式会社に属していたプロジェクトを特定
    // 一般的なプロジェクト名から判断
    const sampleCompanyProjects = [
      'E04-031', 'E04-002', 'E04-003', 'E04-006', 'E04-007', 'RP02-001', 'E04-005', 'E04-040'
    ]
    
    console.log('📋 サンプル建設コンサルタント株式会社のプロジェクトを復元中...')
    
    for (const businessNumber of sampleCompanyProjects) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, business_number')
        .eq('business_number', businessNumber)
        .eq('company_id', testCompanyId)
        .single()
      
      if (project && !projectError) {
        console.log(`🔄 プロジェクト復元: ${project.business_number} - ${project.name}`)
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({ company_id: sampleCompanyId })
          .eq('id', project.id)
        
        if (updateError) {
          console.error(`❌ プロジェクト復元エラー (${project.business_number}):`, updateError)
        } else {
          console.log(`✅ プロジェクト復元完了: ${project.business_number}`)
        }
      }
    }
    
    // 元々サンプル建設コンサルタント株式会社に属していた予算科目を復元
    // 一般的な予算科目名から判断
    const sampleCompanyCategories = [
      '人件費', '外注費', '直接費', '一般管理費', '開発費', '間接費', '委託費', '材料費'
    ]
    
    console.log('📋 サンプル建設コンサルタント株式会社の予算科目を復元中...')
    
    for (const categoryName of sampleCompanyCategories) {
      const { data: category, error: categoryError } = await supabase
        .from('budget_categories')
        .select('id, name, level')
        .eq('name', categoryName)
        .eq('company_id', testCompanyId)
        .single()
      
      if (category && !categoryError) {
        console.log(`🔄 予算科目復元: ${category.name} (レベル${category.level})`)
        
        const { error: updateError } = await supabase
          .from('budget_categories')
          .update({ company_id: sampleCompanyId })
          .eq('id', category.id)
        
        if (updateError) {
          console.error(`❌ 予算科目復元エラー (${category.name}):`, updateError)
        } else {
          console.log(`✅ 予算科目復元完了: ${category.name}`)
        }
      }
    }
    
    console.log('✅ 元の会社データ復元完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

restoreOriginalCompanyData()
