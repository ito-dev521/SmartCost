const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCashFlowAPI() {
  try {
    console.log('🔍 資金管理APIのテスト開始...')
    
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
    
    // プロジェクトデータを取得（会社IDでフィルタリング）
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('business_number', { ascending: true })
    
    if (projectsError) {
      console.error('❌ プロジェクト取得エラー:', projectsError)
    } else {
      console.log(`📋 プロジェクト: ${projects?.length || 0}件`)
      projects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
        console.log(`     契約金額: ${project.contract_amount?.toLocaleString() || 0}円`)
        console.log(`     終了日: ${project.end_date || '未設定'}`)
        console.log(`     クライアント: ${project.client_name || '未設定'}`)
      })
    }
    
    // CADDON請求データを取得（会社IDでフィルタリング）
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('billing_month')
    
    if (caddonError) {
      console.error('❌ CADDON請求取得エラー:', caddonError)
    } else {
      console.log(`📋 CADDON請求: ${caddonBillings?.length || 0}件`)
      caddonBillings?.forEach((billing, index) => {
        console.log(`  ${index + 1}. ${billing.billing_month}: ${billing.total_amount?.toLocaleString() || 0}円`)
      })
    }
    
    // クライアントデータを取得（会社IDでフィルタリング）
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('name')
    
    if (clientsError) {
      console.error('❌ クライアント取得エラー:', clientsError)
    } else {
      console.log(`📋 クライアント: ${clients?.length || 0}件`)
      clients?.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.name}`)
        console.log(`     支払サイクル: ${client.payment_cycle || '未設定'}`)
        console.log(`     支払日: ${client.payment_day || '未設定'}`)
      })
    }
    
    // 原価エントリーデータを取得（会社IDでフィルタリング）
    const { data: costEntries, error: costError } = await supabase
      .from('cost_entries')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('entry_date', { ascending: false })
    
    if (costError) {
      console.error('❌ 原価エントリー取得エラー:', costError)
    } else {
      console.log(`📋 原価エントリー: ${costEntries?.length || 0}件`)
      const totalCost = costEntries?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
      console.log(`     合計原価: ${totalCost.toLocaleString()}円`)
    }
    
    // 決算情報を取得
    const { data: fiscalInfo, error: fiscalError } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', currentUser.company_id)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    if (fiscalError && fiscalError.code !== 'PGRST116') {
      console.error('❌ 決算情報取得エラー:', fiscalError)
    } else if (fiscalInfo) {
      console.log('📋 決算情報:', {
        fiscal_year: fiscalInfo.fiscal_year,
        settlement_month: fiscalInfo.settlement_month,
        current_period: fiscalInfo.current_period,
        bank_balance: fiscalInfo.bank_balance
      })
    } else {
      console.log('📋 決算情報: 未設定（デフォルト値を使用）')
    }
    
    // 年間入金予定表の合計を確認
    console.log('\n📊 年間入金予定表の合計確認:')
    const totalProjectRevenue = projects?.reduce((sum, project) => {
      if (project.contract_amount && project.contract_amount > 0) {
        return sum + project.contract_amount
      }
      return sum
    }, 0) || 0
    
    const totalCaddonRevenue = caddonBillings?.reduce((sum, billing) => {
      return sum + (billing.total_amount || 0)
    }, 0) || 0
    
    console.log(`  プロジェクト収入: ${totalProjectRevenue.toLocaleString()}円`)
    console.log(`  CADDON収入: ${totalCaddonRevenue.toLocaleString()}円`)
    console.log(`  合計収入: ${(totalProjectRevenue + totalCaddonRevenue).toLocaleString()}円`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testCashFlowAPI()
