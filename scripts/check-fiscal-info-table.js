const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFiscalInfoTable() {
  try {
    console.log('🔍 fiscal_infoテーブルの存在確認...\n')

    // 直接テーブルにアクセスして存在確認
    const { data: fiscalData, error: fiscalError } = await supabase
      .from('fiscal_info')
      .select('id, company_id, fiscal_year, settlement_month, current_period, bank_balance, notes')
      .limit(1)

    if (fiscalError) {
      if (fiscalError.code === 'PGRST106') {
        console.log('❌ fiscal_infoテーブルが存在しません')
        console.log('📋 以下のSQLでテーブルを作成してください:')
        console.log(`
CREATE TABLE fiscal_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  settlement_month INTEGER NOT NULL DEFAULT 3,
  current_period INTEGER NOT NULL DEFAULT 1,
  bank_balance BIGINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, fiscal_year)
);

-- RLS (Row Level Security) を有効化
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;

-- ポリシー: 会社のメンバーのみアクセス可能
CREATE POLICY "Users can access their company's fiscal info" ON fiscal_info
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- インデックス作成
CREATE INDEX idx_fiscal_info_company_id ON fiscal_info(company_id);
CREATE INDEX idx_fiscal_info_fiscal_year ON fiscal_info(fiscal_year);
        `)
        return
      } else {
        console.error('❌ 決算情報取得エラー:', fiscalError)
        return
      }
    }

    console.log('✅ fiscal_infoテーブルが存在します')

    // 全データの確認
    const { data: allFiscalData, error: allFiscalError } = await supabase
      .from('fiscal_info')
      .select('id, company_id, fiscal_year, settlement_month, current_period, bank_balance, notes')
      .order('company_id, fiscal_year')

    if (allFiscalError) {
      console.error('❌ 決算情報一覧取得エラー:', allFiscalError)
      return
    }

    console.log(`\n📊 既存の決算情報: ${allFiscalData.length} 件`)
    if (allFiscalData.length > 0) {
      allFiscalData.forEach((info, index) => {
        console.log(`  ${index + 1}. 会社ID: ${info.company_id}, 年度: ${info.fiscal_year}, 決算月: ${info.settlement_month}月`)
      })
    } else {
      console.log('  (データなし)')
    }

  } catch (error) {
    console.error('致命的なエラー:', error)
  }
}

checkFiscalInfoTable()
