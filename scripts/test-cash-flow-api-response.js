const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCashFlowAPIResponse() {
  try {
    console.log('🔍 資金管理APIのレスポンスをテスト開始...')
    
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
    
    // 資金管理APIのロジックを直接実行
    const fiscalYear = new Date().getFullYear()
    const months = 12
    
    console.log('📊 パラメータ:', { fiscalYear, months })
    
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
    
    console.log('📋 取得したデータ:')
    console.log(`  プロジェクト: ${projects?.length || 0}件`)
    console.log(`  クライアント: ${clients?.length || 0}件`)
    console.log(`  CADDON請求: ${caddonBillings?.length || 0}件`)
    console.log(`  決算情報: ${fiscalInfo ? 'あり' : 'なし'}`)
    
    if (fiscalInfo) {
      console.log('📋 決算情報詳細:', {
        fiscal_year: fiscalInfo.fiscal_year,
        settlement_month: fiscalInfo.settlement_month,
        current_period: fiscalInfo.current_period,
        bank_balance: fiscalInfo.bank_balance
      })
    }
    
    // 月別収入を計算
    console.log('\n📊 月別収入計算:')
    const monthlyMap = {}
    
    // 一般管理費を除外したプロジェクトを取得
    const filteredProjects = (projects || []).filter(project => {
      const isCaddonSystem = project.business_number?.startsWith('C') || project.name?.includes('CADDON')
      const isOverhead = project.business_number === 'IP' || project.name?.includes('一般管理費')
      return !isCaddonSystem && !isOverhead
    })
    
    console.log(`  フィルタリング後のプロジェクト: ${filteredProjects.length}件`)
    
    filteredProjects.forEach(project => {
      if (!(project.contract_amount && project.contract_amount > 0)) return
      
      console.log(`\n  プロジェクト: ${project.business_number} - ${project.name}`)
      console.log(`    契約金額: ${project.contract_amount.toLocaleString()}円`)
      console.log(`    終了日: ${project.end_date}`)
      
      if (project.end_date) {
        const client = clients?.find(c => c.name === project.client_name)
        if (client) {
          console.log(`    クライアント: ${client.name}`)
          console.log(`    支払サイクル: ${client.payment_cycle_type}`)
          
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
          
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          console.log(`    計算された支払日: ${paymentDate.toLocaleDateString('ja-JP')}`)
          console.log(`    月別キー: ${monthKey}`)
          
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + project.contract_amount
          console.log(`    月別収入に追加: ${project.contract_amount.toLocaleString()}円`)
        } else {
          console.log(`    クライアント: 見つからない`)
        }
      } else {
        console.log(`    終了日: 未設定`)
      }
    })
    
    // CADDON請求も収入として計上
    caddonBillings?.forEach(billing => {
      const billingDate = new Date(billing.billing_month)
      const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
      const amount = (billing.total_amount ?? billing.amount ?? 0)
      monthlyMap[key] = (monthlyMap[key] || 0) + amount
      console.log(`  CADDON請求: ${key} に ${amount.toLocaleString()}円 追加`)
    })
    
    console.log('\n📊 月別収入マップ:')
    Object.entries(monthlyMap).forEach(([key, amount]) => {
      console.log(`  ${key}: ${amount.toLocaleString()}円`)
    })
    
    // 予測期間の計算
    if (fiscalInfo) {
      const settlementMonth = fiscalInfo.settlement_month
      const nextMonth = settlementMonth === 12 ? 1 : settlementMonth + 1
      const nextYear = settlementMonth === 12 ? fiscalInfo.fiscal_year + 1 : fiscalInfo.fiscal_year
      
      console.log(`\n📅 予測期間: ${nextYear}年${nextMonth}月 から 12ヶ月間`)
      
      // 予測期間内の収入を確認
      console.log('\n📊 予測期間内の収入:')
      for (let i = 0; i < 12; i++) {
        const currentMonth = nextMonth + i
        const currentYear = nextYear + Math.floor((currentMonth - 1) / 12)
        const month = ((currentMonth - 1) % 12) + 1
        const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`
        const amount = monthlyMap[monthKey] || 0
        console.log(`  ${monthKey}: ${amount.toLocaleString()}円`)
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testCashFlowAPIResponse()
