const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCaddonBillingData() {
  try {
    console.log('🔍 CADDON請求データの現在の状況を確認中...')
    
    // CADDON請求データを取得
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')
    
    if (caddonError) {
      console.error('❌ CADDON請求データ取得エラー:', caddonError)
      return
    }
    
    console.log(`📋 CADDON請求データ: ${caddonBillings?.length || 0}件`)
    
    if (caddonBillings && caddonBillings.length > 0) {
      console.log('\n📋 CADDON請求データ詳細:')
      caddonBillings.forEach((billing, index) => {
        console.log(`  ${index + 1}. ID: ${billing.id}`)
        console.log(`     プロジェクトID: ${billing.project_id}`)
        console.log(`     請求月: ${billing.billing_month}`)
        console.log(`     合計金額: ${billing.total_amount}円`)
        console.log(`     CADDON利用料: ${billing.caddon_usage_fee}円`)
        console.log(`     サポート料: ${billing.support_fee}円`)
        console.log('')
      })
      
      // プロジェクト情報も取得
      console.log('📋 関連プロジェクト情報:')
      for (const billing of caddonBillings) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, name, business_number, company_id')
          .eq('id', billing.project_id)
          .single()
        
        if (projectError) {
          console.error(`❌ プロジェクト取得エラー (${billing.project_id}):`, projectError)
        } else {
          console.log(`  ${billing.billing_month}: ${project.business_number} - ${project.name}`)
          console.log(`    会社ID: ${project.company_id}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCaddonBillingData()
