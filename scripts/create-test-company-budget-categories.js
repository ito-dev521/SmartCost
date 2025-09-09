const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestCompanyBudgetCategories() {
  try {
    console.log('🔍 テスト会社10用の予算科目を作成開始...')
    
    // テスト会社10のID
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678'
    
    // テスト会社10用の予算科目データ
    const budgetCategories = [
      { name: '直接費', level: 1, sort_order: 1 },
      { name: '間接費', level: 1, sort_order: 2 },
      { name: '一般管理費', level: 1, sort_order: 3 },
      { name: '開発費', level: 1, sort_order: 4 },
      { name: '人件費', level: 2, sort_order: 5 },
      { name: '外注費', level: 2, sort_order: 6 },
      { name: '材料費', level: 2, sort_order: 7 },
      { name: '委託費', level: 2, sort_order: 8 }
    ]
    
    console.log('📋 テスト会社10用の予算科目を作成中...')
    
    for (const category of budgetCategories) {
      console.log(`🔄 予算科目作成: ${category.name} (レベル${category.level})`)
      
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          name: category.name,
          level: category.level,
          sort_order: category.sort_order,
          company_id: testCompanyId
        })
        .select()
      
      if (error) {
        console.error(`❌ 予算科目作成エラー (${category.name}):`, error)
      } else {
        console.log(`✅ 予算科目作成完了: ${category.name}`)
      }
    }
    
    console.log('✅ テスト会社10用の予算科目作成完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

createTestCompanyBudgetCategories()
