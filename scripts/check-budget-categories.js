const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBudgetCategories() {
  console.log('🔍 予算科目テーブルの確認開始...')
  
  try {
    // 全予算科目を取得
    const { data: allCategories, error: allError } = await supabase
      .from('budget_categories')
      .select('id, name, level, sort_order, company_id')
      .limit(20)
    
    console.log('📋 全予算科目（最初の20件）:')
    allCategories?.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (レベル: ${category.level}, 会社ID: ${category.company_id})`)
    })
    console.log(`総数: ${allCategories?.length || 0}件`)
    
    if (allError) {
      console.error('❌ 全予算科目取得エラー:', allError)
    }
    
    // 会社IDがnullの予算科目を確認
    const { data: nullCategories, error: nullError } = await supabase
      .from('budget_categories')
      .select('id, name, company_id')
      .is('company_id', null)
    
    console.log(`\n📋 会社IDがnullの予算科目: ${nullCategories?.length || 0}件`)
    nullCategories?.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name}`)
    })
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

checkBudgetCategories()
