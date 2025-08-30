const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearBankBalanceHistory() {
  try {
    console.log('🗑️ bank_balance_historyテーブルのデータを削除中...')

    // 既存のデータを削除
    const { error: deleteError } = await supabase
      .from('bank_balance_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全件削除

    if (deleteError) {
      console.log('❌ データ削除エラー:', deleteError.message)
    } else {
      console.log('✅ 既存データの削除完了')
    }

    // 削除後の確認
    const { data: records, error: recordsError } = await supabase
      .from('bank_balance_history')
      .select('*')

    if (recordsError) {
      console.log('❌ データ確認エラー:', recordsError.message)
    } else {
      console.log(`📊 削除後のレコード数: ${records.length}`)
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

clearBankBalanceHistory()
