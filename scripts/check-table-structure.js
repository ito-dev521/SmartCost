const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableStructure() {
  console.log('🔍 テーブル構造の確認開始...')
  
  try {
    // budget_categoriesテーブルの構造を確認
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .limit(1)
    
    console.log('📋 budget_categoriesテーブルの構造:')
    if (categories && categories.length > 0) {
      console.log('カラム:', Object.keys(categories[0]))
    } else {
      console.log('データが存在しません')
    }
    
    if (categoriesError) {
      console.error('❌ budget_categories取得エラー:', categoriesError)
    }
    
    // cost_entriesテーブルの構造も確認
    const { data: costEntries, error: costEntriesError } = await supabase
      .from('cost_entries')
      .select('*')
      .limit(1)
    
    console.log('\n📋 cost_entriesテーブルの構造:')
    if (costEntries && costEntries.length > 0) {
      console.log('カラム:', Object.keys(costEntries[0]))
    } else {
      console.log('データが存在しません')
    }
    
    if (costEntriesError) {
      console.error('❌ cost_entries取得エラー:', costEntriesError)
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

checkTableStructure()
