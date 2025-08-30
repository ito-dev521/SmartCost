const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBankBalanceHistoryStructure() {
  try {
    console.log('🔍 bank_balance_historyテーブルの構造を確認中...')

    // テーブルの情報を取得
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'bank_balance_history')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.log('⚠️ カラム情報取得エラー:', columnsError.message)
    } else {
      console.log('📋 テーブル構造:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL可' : 'NOT NULL'})`)
      })
    }

    // 現在のデータを確認
    const { data: records, error: recordsError } = await supabase
      .from('bank_balance_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.log('❌ データ取得エラー:', recordsError.message)
    } else {
      console.log(`\n📊 現在のレコード数: ${records.length}`)
      if (records.length > 0) {
        console.log('最新のレコード:')
        console.log(JSON.stringify(records[0], null, 2))
      }
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

checkBankBalanceHistoryStructure()
