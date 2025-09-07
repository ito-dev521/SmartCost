const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateBankBalanceHistoryTable() {
  try {
    console.log('🔍 bank_balance_historyテーブルの更新開始...\n')

    // 1. company_idカラムを追加（存在しない場合）
    console.log('1. company_idカラムの追加...')
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bank_balance_history' 
            AND column_name = 'company_id'
          ) THEN
            ALTER TABLE bank_balance_history 
            ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `
    })

    if (addColumnError) {
      console.error('❌ company_idカラム追加エラー:', addColumnError)
    } else {
      console.log('✅ company_idカラム追加完了')
    }

    // 2. インデックスを追加
    console.log('2. インデックスの追加...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_bank_balance_history_company_id ON bank_balance_history(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_bank_balance_history_company_balance_date ON bank_balance_history(company_id, balance_date);'
    ]

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql })
      if (indexError) {
        console.error('❌ インデックス追加エラー:', indexError)
      } else {
        console.log('✅ インデックス追加完了')
      }
    }

    // 3. RLSポリシーを更新
    console.log('3. RLSポリシーの更新...')
    const policies = [
      `DROP POLICY IF EXISTS "super_admin_all_access" ON bank_balance_history;`,
      `CREATE POLICY "company_users_access" ON bank_balance_history
        FOR ALL USING (
          company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
          )
        );`,
      `CREATE POLICY "super_admin_all_access" ON bank_balance_history
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM super_admins 
            WHERE user_id = auth.uid()
          )
        );`
    ]

    for (const policySql of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySql })
      if (policyError) {
        console.error('❌ ポリシー更新エラー:', policyError)
      } else {
        console.log('✅ ポリシー更新完了')
      }
    }

    console.log('\n✅ bank_balance_historyテーブルの更新完了！')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

updateBankBalanceHistoryTable()
