const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCashFlowAPIDirect() {
  try {
    console.log('🔍 資金管理APIの直接テスト開始...')
    
    // 現在のユーザー（ito.dev@ii-stylelab.com）の情報を取得
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, company_id')
      .eq('email', 'ito.dev@ii-stylelab.com')
      .single()
    
    if (userError || !currentUser) {
      console.error('❌ ユーザー取得エラー:', userError)
      return
    }
    
    console.log('👤 現在のユーザー:', {
      email: currentUser.email,
      name: currentUser.name,
      company_id: currentUser.company_id
    })
    
    // プロジェクトデータを取得
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('business_number', { ascending: true })
    
    // クライアントデータを取得
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('name')
    
    // CADDON請求データを取得
    const { data: caddonBillings } = await supabase
      .from('caddon_billing')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('billing_month')
    
    // 決算情報を取得
    const { data: fiscalInfo } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    console.log('\n📊 データ確認:')
    console.log(`  プロジェクト: ${projects?.length || 0}件`)
    console.log(`  クライアント: ${clients?.length || 0}件`)
    console.log(`  CADDON請求: ${caddonBillings?.length || 0}件`)
    console.log(`  決算情報: ${fiscalInfo ? 'あり' : 'なし'}`)
    
    // 支払日計算のテスト
    console.log('\n📅 支払日計算テスト:')
    projects?.forEach(project => {
      if (project.end_date && project.contract_amount && project.contract_amount > 0) {
        const client = clients?.find(c => c.name === project.client_name)
        if (client) {
          console.log(`\n  プロジェクト: ${project.business_number} - ${project.name}`)
          console.log(`    契約金額: ${project.contract_amount.toLocaleString()}円`)
          console.log(`    終了日: ${project.end_date}`)
          console.log(`    クライアント: ${client.name}`)
          console.log(`    支払サイクル: ${client.payment_cycle_type}`)
          console.log(`    支払日: ${client.payment_cycle_payment_day}日`)
          
          // 支払日計算
          const endDate = new Date(project.end_date)
          let paymentDate = new Date()
          
          if (client.payment_cycle_type === 'month_end') {
            const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
            const targetYear = endDate.getFullYear()
            const targetMonth = endDate.getMonth() + paymentMonthOffset
            const finalYear = targetMonth >= 12 ? targetYear + Math.floor(targetMonth / 12) : targetYear
            const finalMonth = targetMonth >= 12 ? targetMonth % 12 : targetMonth
            paymentDate.setFullYear(finalYear)
            paymentDate.setMonth(finalMonth)
            paymentDate.setDate(new Date(finalYear, finalMonth + 1, 0).getDate())
          } else if (client.payment_cycle_type === 'specific_date') {
            const closingDay = client.payment_cycle_closing_day || 25
            const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
            const paymentDay = client.payment_cycle_payment_day || 15
            
            if (endDate.getDate() <= closingDay) {
              paymentDate.setFullYear(endDate.getFullYear())
              paymentDate.setMonth(endDate.getMonth() + paymentMonthOffset)
              paymentDate.setDate(paymentDay)
            } else {
              paymentDate.setFullYear(endDate.getFullYear())
              paymentDate.setMonth(endDate.getMonth() + paymentMonthOffset + 1)
              paymentDate.setDate(paymentDay)
            }
          }
          
          console.log(`    計算された支払日: ${paymentDate.toLocaleDateString('ja-JP')}`)
          
          // 月別収入マップに追加
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          console.log(`    月別キー: ${monthKey}`)
        }
      }
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testCashFlowAPIDirect()
