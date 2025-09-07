const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBankBalanceHistoryTable() {
  try {
    console.log('🔍 bank_balance_historyテーブルの構造確認...\n')

    // テーブルの存在確認
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'bank_balance_history')

    if (tablesError) {
      console.error('❌ テーブル確認エラー:', tablesError)
      return
    }

    if (tables.length === 0) {
      console.log('❌ bank_balance_historyテーブルが存在しません')
      console.log('📋 以下のSQLを実行してテーブルを作成してください:')
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
      return
    }

    console.log('✅ bank_balance_historyテーブルが存在します')

    // カラムの確認
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'bank_balance_history')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ カラム確認エラー:', columnsError)
      return
    }

    console.log('\n📋 テーブル構造:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL可' : 'NOT NULL'})`)
    })

    // company_idカラムの確認
    const hasCompanyId = columns.some(col => col.column_name === 'company_id')
    if (!hasCompanyId) {
      console.log('\n❌ company_idカラムが存在しません')
      console.log('📋 以下のSQLを実行してカラムを追加してください:')
      console.log('ALTER TABLE bank_balance_history ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;')
    } else {
      console.log('\n✅ company_idカラムが存在します')
    }

    // データの確認
    const { data: data, error: dataError } = await supabase
      .from('bank_balance_history')
      .select('*')
      .limit(5)

    if (dataError) {
      console.error('❌ データ確認エラー:', dataError)
    } else {
      console.log(`\n📊 データ件数: ${data.length}件`)
      if (data.length > 0) {
        console.log('📋 サンプルデータ:')
        console.log(JSON.stringify(data[0], null, 2))
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkBankBalanceHistoryTable()
