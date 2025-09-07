const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addCompanyIdToBudgetCategories() {
  console.log('🔧 budget_categoriesテーブルにcompany_idカラムを追加開始...')
  
  try {
    // 1. company_idカラムを追加
    console.log('1. company_idカラムを追加中...')
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE budget_categories 
        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      `
    })
    
    if (addColumnError) {
      console.error('❌ カラム追加エラー:', addColumnError)
      // 直接SQLを実行してみる
      console.log('直接SQL実行を試行中...')
    }
    
    // 2. 既存データにデフォルトの会社IDを設定
    console.log('2. 既存データにデフォルトの会社IDを設定中...')
    const defaultCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    const { data: updatedCategories, error: updateError } = await supabase
      .from('budget_categories')
      .update({ company_id: defaultCompanyId })
      .is('company_id', null)
      .select('id, name, company_id')
    
    if (updateError) {
      console.error('❌ データ更新エラー:', updateError)
    } else {
      console.log('✅ 更新された予算科目:')
      updatedCategories?.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (会社ID: ${category.company_id})`)
      })
    }
    
    // 3. 結果確認
    console.log('\n3. 結果確認中...')
    const { data: allCategories, error: checkError } = await supabase
      .from('budget_categories')
      .select('id, name, company_id')
      .limit(10)
    
    if (checkError) {
      console.error('❌ 確認エラー:', checkError)
    } else {
      console.log('📋 予算科目（最初の10件）:')
      allCategories?.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (会社ID: ${category.company_id})`)
      })
      console.log(`総数: ${allCategories?.length || 0}件`)
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
    console.log('\n💡 手動でSQLを実行してください:')
    console.log('SupabaseのSQLエディターで以下のSQLを実行してください:')
    console.log(`
ALTER TABLE budget_categories 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

UPDATE budget_categories 
SET company_id = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
WHERE company_id IS NULL;

ALTER TABLE budget_categories 
ALTER COLUMN company_id SET NOT NULL;
    `)
  }
}

addCompanyIdToBudgetCategories()
