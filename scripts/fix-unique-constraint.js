const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixUniqueConstraint() {
  try {
    console.log('🔍 bank_balance_historyテーブルのユニーク制約修正...\n')

    // 現在の制約を確認するために、重複データの挿入を試行
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
        console.log('📋 修正が必要: company_id + fiscal_year + balance_date の組み合わせに変更')
        console.log('\n以下のSQLをSupabaseのSQL Editorで実行してください:')
        console.log(`
-- 既存のユニーク制約を削除
ALTER TABLE bank_balance_history 
DROP CONSTRAINT IF EXISTS bank_balance_history_fiscal_year_balance_date_key;

-- 新しいユニーク制約を追加（company_idを含む）
ALTER TABLE bank_balance_history 
ADD CONSTRAINT bank_balance_history_company_fiscal_balance_unique 
UNIQUE (company_id, fiscal_year, balance_date);
        `)
      }
    } else {
      console.log('⚠️  制約が機能していません')
      // テストデータを削除
      await supabase
        .from('bank_balance_history')
        .delete()
        .eq('id', insertData[0].id)
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

fixUniqueConstraint()
