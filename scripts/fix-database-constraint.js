const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabaseConstraint() {
  try {
    console.log('🔍 データベース制約の修正開始...\n')

    // 1. 現在の制約をテスト
    console.log('1. 現在の制約をテスト...')
    const testData = {
      company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9',
      fiscal_year: 2025,
      balance_date: '2025-02-01', // 既存データと同じ
      opening_balance: 1000000,
      closing_balance: 2000000,
      total_income: 1500000,
      total_expense: 500000
    }

    const { data: insertData, error: insertError } = await supabase
      .from('bank_balance_history')
      .insert([testData])
      .select('*')

    if (insertError) {
      console.log('✅ 制約が機能しています（期待される動作）')
      console.log('エラー:', insertError.message)
      
      if (insertError.code === '23505') {
        console.log('\n📋 現在の制約: fiscal_year + balance_date の組み合わせでユニーク')
        console.log('📋 問題: 同じ年月のデータを複数作成できない')
        console.log('📋 解決策: company_id + fiscal_year + balance_date の組み合わせに変更')
        
        console.log('\n🔧 修正手順:')
        console.log('1. 既存のユニーク制約を削除')
        console.log('2. 新しいユニーク制約を追加（company_idを含む）')
        
        console.log('\n📋 SupabaseのSQL Editorで以下のSQLを実行してください:')
        console.log(`
-- 既存のユニーク制約を削除
ALTER TABLE bank_balance_history 
DROP CONSTRAINT IF EXISTS bank_balance_history_fiscal_year_balance_date_key;

-- 新しいユニーク制約を追加（company_idを含む）
ALTER TABLE bank_balance_history 
ADD CONSTRAINT bank_balance_history_company_fiscal_balance_unique 
UNIQUE (company_id, fiscal_year, balance_date);
        `)
        
        console.log('\n💡 この修正により:')
        console.log('- 同じ会社内では同じ年月のデータを複数作成できない')
        console.log('- 異なる会社では同じ年月のデータを作成できる')
        console.log('- より柔軟なデータ管理が可能になる')
      }
    } else {
      console.log('⚠️  制約が機能していません')
      // テストデータを削除
      await supabase
        .from('bank_balance_history')
        .delete()
        .eq('id', insertData[0].id)
    }

    // 2. 現在のデータを確認
    console.log('\n2. 現在のデータを確認...')
    const { data: existingData, error: dataError } = await supabase
      .from('bank_balance_history')
      .select('*')
      .eq('company_id', '4440fcae-03f2-4b0c-8c55-e19017ce08c9')
      .order('balance_date', { ascending: false })

    if (dataError) {
      console.error('❌ データ取得エラー:', dataError)
    } else {
      console.log(`📊 既存データ件数: ${existingData.length}件`)
      existingData.forEach((record, index) => {
        console.log(`${index + 1}. ${record.fiscal_year}年${new Date(record.balance_date).getMonth() + 1}月: ${record.opening_balance} → ${record.closing_balance}`)
      })
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

fixDatabaseConstraint()
