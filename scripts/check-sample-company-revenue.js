const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSampleCompanyRevenue() {
  try {
    console.log('🔍 サンプル建設コンサルタントの収入予測を確認開始...')
    
    // サンプル建設コンサルタントの会社ID
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    // プロジェクトデータを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('business_number', { ascending: true })
    
    if (projectsError) {
      console.error('❌ プロジェクト取得エラー:', projectsError)
      return
    }
    
    // クライアントデータを取得
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('name')
    
    if (clientsError) {
      console.error('❌ クライアント取得エラー:', clientsError)
      return
    }
    
    // CADDON請求データを取得
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('billing_month')
    
    if (caddonError) {
      console.error('❌ CADDON請求取得エラー:', caddonError)
      return
    }
    
    // 決算情報を取得
    const { data: fiscalInfo, error: fiscalError } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    if (fiscalError && fiscalError.code !== 'PGRST116') {
      console.error('❌ 決算情報取得エラー:', fiscalError)
      return
    }
    
    console.log('📊 サンプル建設コンサルタントのデータ:')
    console.log(`  プロジェクト: ${projects?.length || 0}件`)
    console.log(`  クライアント: ${clients?.length || 0}件`)
    console.log(`  CADDON請求: ${caddonBillings?.length || 0}件`)
    console.log(`  決算情報: ${fiscalInfo ? 'あり' : 'なし'}`)
    
    if (fiscalInfo) {
      console.log('\n📋 決算情報詳細:')
      console.log(`  決算年度: ${fiscalInfo.fiscal_year}年`)
      console.log(`  決算月: ${fiscalInfo.settlement_month}月`)
      console.log(`  現在期間: ${fiscalInfo.current_period}期`)
      console.log(`  銀行残高: ${fiscalInfo.bank_balance?.toLocaleString() || 0}円`)
    }
    
    // プロジェクト詳細を表示
    console.log('\n📋 プロジェクト一覧:')
    projects?.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
      console.log(`     契約金額: ${project.contract_amount?.toLocaleString() || 0}円`)
      console.log(`     終了日: ${project.end_date || '未設定'}`)
      console.log(`     クライアント: ${project.client_name || '未設定'}`)
      console.log(`     会社ID: ${project.company_id}`)
    })
    
    // クライアント詳細を表示
    console.log('\n📋 クライアント一覧:')
    clients?.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name}`)
      console.log(`     支払サイクル: ${client.payment_cycle_type || '未設定'}`)
      console.log(`     支払日: ${client.payment_cycle_payment_day || '未設定'}日`)
      console.log(`     支払月オフセット: ${client.payment_cycle_payment_month_offset || '未設定'}`)
      console.log(`     説明: ${client.payment_cycle_description || '未設定'}`)
    })
    
    // CADDON請求詳細を表示
    console.log('\n📋 CADDON請求一覧:')
    caddonBillings?.forEach((billing, index) => {
      console.log(`  ${index + 1}. ${billing.billing_month}`)
      console.log(`     金額: ${billing.total_amount?.toLocaleString() || 0}円`)
      console.log(`     プロジェクト: ${billing.project_id}`)
    })
    
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
    
    // 合計収入を計算
    const totalRevenue = Object.values(monthlyMap).reduce((sum, amount) => sum + amount, 0)
    console.log(`\n💰 合計収入予測: ${totalRevenue.toLocaleString()}円`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSampleCompanyRevenue()
