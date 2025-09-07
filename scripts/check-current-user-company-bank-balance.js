const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCurrentUserCompanyBankBalance() {
  try {
    console.log('🔍 現在のユーザーと銀行残高履歴の関係確認...\n')

    // 1. 全ユーザーを取得
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, company_id, role')
      .limit(10)

    if (usersError) {
      console.error('❌ ユーザー取得エラー:', usersError)
      return
    }

    console.log(`📊 ユーザー数: ${users.length}件`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Company ID: ${user.company_id}`)
      console.log(`   Role: ${user.role}`)
      console.log('')
    })

    // 2. 全銀行残高履歴を取得
    const { data: bankHistory, error: bankError } = await supabase
      .from('bank_balance_history')
      .select('*')
      .order('balance_date', { ascending: false })

    if (bankError) {
      console.error('❌ 銀行残高履歴取得エラー:', bankError)
      return
    }

    console.log(`📊 銀行残高履歴数: ${bankHistory.length}件`)
    bankHistory.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`)
      console.log(`   Company ID: ${record.company_id}`)
      console.log(`   Fiscal Year: ${record.fiscal_year}`)
      console.log(`   Balance Date: ${record.balance_date}`)
      console.log(`   Opening Balance: ${record.opening_balance}`)
      console.log(`   Closing Balance: ${record.closing_balance}`)
      console.log('')
    })

    // 3. 会社ID別のデータ分布を確認
    const companyData = {}
    bankHistory.forEach(record => {
      if (!companyData[record.company_id]) {
        companyData[record.company_id] = []
      }
      companyData[record.company_id].push(record)
    })

    console.log('📊 会社ID別銀行残高履歴分布:')
    Object.keys(companyData).forEach(companyId => {
      console.log(`  - 会社ID ${companyId}: ${companyData[companyId].length}件`)
    })

    // 4. ユーザーと会社の関係を確認
    console.log('\n📊 ユーザーと会社の関係:')
    users.forEach(user => {
      const userBankHistory = bankHistory.filter(record => record.company_id === user.company_id)
      console.log(`  - ユーザー ${user.email} (${user.company_id}): ${userBankHistory.length}件の銀行残高履歴`)
    })

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkCurrentUserCompanyBankBalance()
