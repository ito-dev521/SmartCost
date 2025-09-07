const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBankBalanceHistory() {
  try {
    console.log('🔍 bank_balance_historyテーブルのテスト...\n')

    // 1. テーブルにアクセスできるかテスト
    console.log('1. テーブルアクセステスト...')
    const { data, error } = await supabase
      .from('bank_balance_history')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ テーブルアクセスエラー:', error)
      
      if (error.code === 'PGRST116') {
        console.log('📋 テーブルが存在しません。以下のSQLを実行してください:')
        console.log(`
-- bank_balance_historyテーブルの作成
CREATE TABLE bank_balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  balance_date DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_bank_balance_history_company_id ON bank_balance_history(company_id);
CREATE INDEX idx_bank_balance_history_fiscal_year ON bank_balance_history(fiscal_year);
CREATE INDEX idx_bank_balance_history_balance_date ON bank_balance_history(balance_date);
CREATE INDEX idx_bank_balance_history_company_balance_date ON bank_balance_history(company_id, balance_date);

-- RLSポリシーの設定
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;

-- 会社のユーザーが自分の会社のデータのみアクセス可能
CREATE POLICY "company_users_access" ON bank_balance_history
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- スーパー管理者は全データにアクセス可能
CREATE POLICY "super_admin_all_access" ON bank_balance_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );
        `)
      }
      return
    }

    console.log('✅ テーブルアクセス成功')
    console.log('📊 データ件数:', data.length)

    // 2. テストデータの挿入
    console.log('\n2. テストデータ挿入テスト...')
    const testData = {
      company_id: '00000000-0000-0000-0000-000000000000', // テスト用のダミーID
      fiscal_year: 2025,
      balance_date: '2025-02-01',
      opening_balance: 2500000,
      closing_balance: 3500000,
      total_income: 2000000,
      total_expense: 1000000
    }

    const { data: insertData, error: insertError } = await supabase
      .from('bank_balance_history')
      .insert([testData])
      .select('*')

    if (insertError) {
      console.error('❌ テストデータ挿入エラー:', insertError)
      console.error('エラー詳細:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('✅ テストデータ挿入成功:', insertData[0])
      
      // テストデータを削除
      const { error: deleteError } = await supabase
        .from('bank_balance_history')
        .delete()
        .eq('id', insertData[0].id)
      
      if (deleteError) {
        console.error('❌ テストデータ削除エラー:', deleteError)
      } else {
        console.log('✅ テストデータ削除成功')
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

testBankBalanceHistory()
