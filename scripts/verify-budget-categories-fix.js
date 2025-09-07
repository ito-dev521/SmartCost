const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyBudgetCategoriesFix() {
  console.log('🔍 budget_categoriesテーブルの修正確認...')
  
  try {
    // 予算科目を取得
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('id, name, level, sort_order, company_id')
      .limit(20)
    
    if (categoriesError) {
      console.error('❌ 予算科目取得エラー:', categoriesError)
      return
    }
    
    console.log('📋 予算科目（最初の20件）:')
    categories?.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (レベル: ${category.level}, 会社ID: ${category.company_id})`)
    })
    console.log(`総数: ${categories?.length || 0}件`)
    
    if (categories && categories.length > 0) {
      console.log('\n✅ budget_categoriesテーブルの修正が完了しました！')
    } else {
      console.log('\n⚠️ 予算科目データが存在しません。サンプルデータを作成します...')
      
      // サンプル予算科目データを作成
      const sampleCategories = [
        { name: '人件費', level: 1, sort_order: 1, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '材料費', level: 1, sort_order: 2, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '外注費', level: 1, sort_order: 3, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '旅費交通費', level: 1, sort_order: 4, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '通信費', level: 1, sort_order: 5, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '光熱費', level: 1, sort_order: 6, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '賃借料', level: 1, sort_order: 7, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: '減価償却費', level: 1, sort_order: 8, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' },
        { name: 'その他経費', level: 1, sort_order: 9, company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' }
      ]
      
      const { data: insertedCategories, error: insertError } = await supabase
        .from('budget_categories')
        .insert(sampleCategories)
        .select()
      
      if (insertError) {
        console.error('❌ サンプルデータ作成エラー:', insertError)
      } else {
        console.log('✅ サンプル予算科目データを作成しました:')
        insertedCategories?.forEach((category, index) => {
          console.log(`  ${index + 1}. ${category.name}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

verifyBudgetCategoriesFix()
