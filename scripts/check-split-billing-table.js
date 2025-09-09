const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSplitBillingTable() {
  try {
    console.log('🔍 split_billingテーブルの構造を確認中...\n')
    
    // 1. テーブル構造の確認
    console.log('📋 1. split_billingテーブルの構造:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'split_billing')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ カラム情報取得エラー:', columnsError)
    } else {
      console.log('  カラム一覧:')
      columns?.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // 2. 既存データの確認
    console.log('\n📋 2. 既存データの確認:')
    const { data: existingData, error: dataError } = await supabase
      .from('split_billing')
      .select('*')
      .limit(5)

    if (dataError) {
      console.error('❌ データ取得エラー:', dataError)
    } else {
      console.log(`  レコード数: ${existingData?.length || 0}件`)
      if (existingData && existingData.length > 0) {
        console.log('  サンプルデータ:')
        existingData.forEach((item, index) => {
          console.log(`    ${index + 1}: ${JSON.stringify(item, null, 2)}`)
        })
      }
    }

    // 3. company_idカラムの存在確認
    console.log('\n📋 3. company_idカラムの存在確認:')
    const hasCompanyId = columns?.some(col => col.column_name === 'company_id')
    console.log(`  company_idカラム: ${hasCompanyId ? '✅ 存在' : '❌ 不存在'}`)

    if (!hasCompanyId) {
      console.log('\n⚠️  company_idカラムが存在しません。')
      console.log('  以下のSQLを実行してカラムを追加してください:')
      console.log('')
      console.log('  ALTER TABLE split_billing ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;')
      console.log('')
      console.log('  既存データのcompany_idを更新する場合:')
      console.log('  UPDATE split_billing SET company_id = (SELECT company_id FROM projects WHERE projects.id = split_billing.project_id);')
      console.log('')
      console.log('  インデックスを追加:')
      console.log('  CREATE INDEX IF NOT EXISTS idx_split_billing_company_id ON split_billing(company_id);')
      console.log('')
      console.log('  RLSポリシーを追加:')
      console.log('  CREATE POLICY "Users can view split billing for their company projects" ON split_billing')
      console.log('    FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));')
      console.log('  CREATE POLICY "Users can insert split billing for their company projects" ON split_billing')
      console.log('    FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));')
      console.log('  CREATE POLICY "Users can update split billing for their company projects" ON split_billing')
      console.log('    FOR UPDATE USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));')
      console.log('  CREATE POLICY "Users can delete split billing for their company projects" ON split_billing')
      console.log('    FOR DELETE USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));')
    }

    console.log('\n✅ split_billingテーブルの確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSplitBillingTable()
