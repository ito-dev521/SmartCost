const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBankBalanceHistoryTable() {
  try {
    console.log('🔧 bank_balance_historyテーブルの作成を開始...')

    // テーブルの作成
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bank_balance_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          fiscal_year INTEGER NOT NULL,
          balance_date DATE NOT NULL,
          opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
          closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
          total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
          total_expense DECIMAL(15,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createTableError) {
      console.log('⚠️ テーブル作成エラー（既に存在する可能性）:', createTableError.message)
    } else {
      console.log('✅ テーブル作成完了')
    }

    // インデックスの作成
    console.log('📊 インデックスの作成...')
    
    const { error: index1Error } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_bank_balance_history_fiscal_year ON bank_balance_history(fiscal_year);'
    })
    
    const { error: index2Error } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_bank_balance_history_balance_date ON bank_balance_history(balance_date);'
    })

    if (index1Error) console.log('⚠️ インデックス1作成エラー:', index1Error.message)
    if (index2Error) console.log('⚠️ インデックス2作成エラー:', index2Error.message)

    // RLSの有効化
    console.log('🔒 RLSの設定...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.log('⚠️ RLS設定エラー:', rlsError.message)
    } else {
      console.log('✅ RLS有効化完了')
    }

    // ポリシーの作成
    console.log('📋 アクセスポリシーの作成...')
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "super_admin_all_access" ON bank_balance_history
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM super_admins 
            WHERE user_id = auth.uid()
          )
        );
      `
    })

    if (policyError) {
      console.log('⚠️ ポリシー作成エラー:', policyError.message)
    } else {
      console.log('✅ アクセスポリシー作成完了')
    }

    // テーブルの確認
    console.log('🔍 テーブルの確認...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('bank_balance_history')
      .select('*')
      .limit(1)

    if (tableError) {
      console.log('❌ テーブルアクセスエラー:', tableError.message)
    } else {
      console.log('✅ テーブルアクセス成功')
      console.log('📊 テーブル構造:', tableInfo)
    }

    console.log('🎉 bank_balance_historyテーブルの設定が完了しました')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

createBankBalanceHistoryTable()
