const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExistingFebruaryData() {
  try {
    console.log('🔍 2025年02月の既存データ確認...\n')

    // 2025年02月のデータを取得
    const { data: februaryData, error } = await supabase
      .from('bank_balance_history')
      .select('*')
      .eq('fiscal_year', 2025)
      .eq('balance_date', '2025-02-01')

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    if (februaryData.length === 0) {
      console.log('📊 2025年02月のデータは存在しません')
    } else {
      console.log(`📊 2025年02月のデータ: ${februaryData.length}件`)
      februaryData.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`)
        console.log(`   Company ID: ${record.company_id}`)
        console.log(`   Fiscal Year: ${record.fiscal_year}`)
        console.log(`   Balance Date: ${record.balance_date}`)
        console.log(`   Opening Balance: ${record.opening_balance}`)
        console.log(`   Closing Balance: ${record.closing_balance}`)
        console.log(`   Total Income: ${record.total_income}`)
        console.log(`   Total Expense: ${record.total_expense}`)
        console.log(`   Created At: ${record.created_at}`)
      })
    }

    // 全データの年月を確認
    console.log('\n📊 全データの年月一覧:')
    const { data: allData, error: allError } = await supabase
      .from('bank_balance_history')
      .select('fiscal_year, balance_date')
      .order('balance_date', { ascending: true })

    if (allError) {
      console.error('❌ 全データ取得エラー:', allError)
    } else {
      allData.forEach((record, index) => {
        const month = new Date(record.balance_date).getMonth() + 1
        console.log(`${index + 1}. ${record.fiscal_year}年${month}月`)
      })
    }

    console.log('\n💡 解決策:')
    console.log('1. 既存の2025年02月データを編集する')
    console.log('2. 別の年月（例：2025年06月）を選択する')
    console.log('3. データベース制約を修正する（長期的解決策）')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkExistingFebruaryData()
