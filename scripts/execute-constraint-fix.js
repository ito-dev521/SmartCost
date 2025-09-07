const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeConstraintFix() {
  try {
    console.log('🔧 データベース制約の修正を実行...\n')

    // SQLファイルを読み込み
    const sqlPath = path.join(process.cwd(), 'database', 'fix_bank_balance_history_constraint.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 実行するSQL:')
    console.log(sqlContent)
    console.log('\n' + '='.repeat(50) + '\n')

    // SQLを実行
    console.log('🚀 SQLの実行開始...')
    
    // 注意: Supabaseのクライアントライブラリでは直接SQLを実行できないため、
    // 手動でSupabaseのSQL Editorで実行する必要があります
    
    console.log('⚠️  注意: Supabaseのクライアントライブラリでは直接SQLを実行できません')
    console.log('📋 以下の手順で手動実行してください:')
    console.log('')
    console.log('1. Supabaseのダッシュボードにログイン')
    console.log('2. SQL Editorを開く')
    console.log('3. 以下のSQLをコピー&ペーストして実行:')
    console.log('')
    console.log('-- 既存のユニーク制約を削除')
    console.log('ALTER TABLE bank_balance_history')
    console.log('DROP CONSTRAINT IF EXISTS bank_balance_history_fiscal_year_balance_date_key;')
    console.log('')
    console.log('-- 新しいユニーク制約を追加（company_idを含む）')
    console.log('ALTER TABLE bank_balance_history')
    console.log('ADD CONSTRAINT bank_balance_history_company_fiscal_balance_unique')
    console.log('UNIQUE (company_id, fiscal_year, balance_date);')
    console.log('')
    console.log('4. 実行後、以下のテストを実行してください:')
    console.log('   node scripts/test-constraint-fix.js')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

executeConstraintFix()
