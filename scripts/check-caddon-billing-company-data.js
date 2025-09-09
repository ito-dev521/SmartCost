const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCaddonBillingCompanyData() {
  try {
    console.log('🔍 CADDON請求データの会社ID分布を確認中...')
    
    // 会社一覧を取得
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    console.log('🏢 会社一覧:')
    companies?.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`)
    })
    
    // CADDON請求データを取得
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('id, project_id, billing_month, total_amount, company_id')
      .order('billing_month')
    
    if (caddonError) {
      console.error('❌ CADDON請求データ取得エラー:', caddonError)
      return
    }
    
    console.log('\n📋 CADDON請求データ一覧:')
    caddonBillings?.forEach((billing, index) => {
      const company = companies?.find(c => c.id === billing.company_id)
      console.log(`  ${index + 1}. 請求月: ${billing.billing_month}, 金額: ${billing.total_amount}, 会社: ${company?.name || '不明'} (${billing.company_id})`)
    })
    
    // 会社別のCADDON請求データ数を確認
    console.log('\n📊 会社別CADDON請求データ数:')
    for (const company of companies || []) {
      const companyBillings = caddonBillings?.filter(b => b.company_id === company.id) || []
      console.log(`  ${company.name}: ${companyBillings.length}件`)
      if (companyBillings.length > 0) {
        const totalAmount = companyBillings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
        console.log(`    合計金額: ${totalAmount.toLocaleString()}円`)
      }
    }
    
    // company_idがnullのデータを確認
    const nullCompanyBillings = caddonBillings?.filter(b => !b.company_id) || []
    if (nullCompanyBillings.length > 0) {
      console.log('\n⚠️ company_idがnullのCADDON請求データ:')
      nullCompanyBillings.forEach(billing => {
        console.log(`  - 請求月: ${billing.billing_month}, 金額: ${billing.total_amount}`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCaddonBillingCompanyData()
