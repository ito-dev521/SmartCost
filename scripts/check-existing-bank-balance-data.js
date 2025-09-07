const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExistingBankBalanceData() {
  try {
    console.log('🔍 既存のbank_balance_historyデータ確認...\n')

    // 既存データを取得
    const { data, error } = await supabase
      .from('bank_balance_history')
      .select('*')
      .limit(10)

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    console.log(`📊 既存データ件数: ${data.length}件`)
    
    if (data.length > 0) {
      console.log('\n📋 既存データ:')
      data.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`)
        console.log(`   fiscal_year: ${record.fiscal_year}`)
        console.log(`   balance_date: ${record.balance_date}`)
        console.log(`   opening_balance: ${record.opening_balance}`)
        console.log(`   closing_balance: ${record.closing_balance}`)
        console.log(`   total_income: ${record.total_income}`)
        console.log(`   total_expense: ${record.total_expense}`)
        console.log(`   company_id: ${record.company_id || 'なし'}`)
        console.log(`   created_at: ${record.created_at}`)
      })

      // company_idがない場合は警告
      const hasCompanyId = data.some(record => record.company_id)
      if (!hasCompanyId) {
        console.log('\n⚠️  警告: company_idカラムが存在しないか、データが設定されていません')
        console.log('📋 以下のSQLを実行してカラムを追加してください:')
        console.log('ALTER TABLE bank_balance_history ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;')
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkExistingBankBalanceData()
