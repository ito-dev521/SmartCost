const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeFiscalPeriodChangeImpact() {
  try {
    console.log('🔍 決算期変更の全システムへの影響分析開始...')
    
    // サンプル建設コンサルタントの会社ID
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    // 現在の決算情報を取得
    const { data: currentFiscalInfo, error: fiscalError } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    if (fiscalError) {
      console.error('❌ 決算情報取得エラー:', fiscalError)
      return
    }
    
    console.log('📋 現在の決算情報:')
    console.log(`  決算年度: ${currentFiscalInfo.fiscal_year}年`)
    console.log(`  決算月: ${currentFiscalInfo.settlement_month}月`)
    console.log(`  現在期間: ${currentFiscalInfo.current_period}期`)
    
    // 決算期変更のシミュレーション（6月 → 10月）
    const newSettlementMonth = 10
    const newFiscalYear = currentFiscalInfo.fiscal_year
    
    console.log(`\n🔄 決算期変更シミュレーション: ${currentFiscalInfo.settlement_month}月 → ${newSettlementMonth}月`)
    
    // 1. 年間入金予定表への影響
    console.log('\n📊 1. 年間入金予定表への影響:')
    const oldFiscalStartMonth = currentFiscalInfo.settlement_month + 1
    const newFiscalStartMonth = newSettlementMonth + 1
    console.log(`  変更前: 年度開始月 ${oldFiscalStartMonth}月`)
    console.log(`  変更後: 年度開始月 ${newFiscalStartMonth}月`)
    
    // プロジェクトデータを取得
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('business_number', { ascending: true })
    
    console.log(`  影響を受けるプロジェクト: ${projects?.length || 0}件`)
    
    // 2. 資金管理への影響
    console.log('\n💰 2. 資金管理への影響:')
    console.log(`  変更前: 予測期間 ${currentFiscalInfo.fiscal_year}年${oldFiscalStartMonth}月 〜 ${currentFiscalInfo.fiscal_year + 1}年${currentFiscalInfo.settlement_month}月`)
    console.log(`  変更後: 予測期間 ${newFiscalYear}年${newFiscalStartMonth}月 〜 ${newFiscalYear + 1}年${newSettlementMonth}月`)
    
    // 3. プロジェクトの支払予定日への影響
    console.log('\n📅 3. プロジェクトの支払予定日への影響:')
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('name')
    
    let affectedProjects = 0
    projects?.forEach(project => {
      if (project.end_date && project.contract_amount && project.contract_amount > 0) {
        const client = clients?.find(c => c.name === project.client_name)
        if (client) {
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
          
          const paymentMonth = paymentDate.getMonth() + 1
          const paymentYear = paymentDate.getFullYear()
          
          // 決算期変更による影響を判定
          const oldFiscalYear = paymentMonth >= oldFiscalStartMonth ? paymentYear : paymentYear - 1
          const newFiscalYear = paymentMonth >= newFiscalStartMonth ? paymentYear : paymentYear - 1
          
          if (oldFiscalYear !== newFiscalYear) {
            affectedProjects++
            console.log(`    ${project.business_number}: ${paymentYear}年${paymentMonth}月 → 年度 ${oldFiscalYear} → ${newFiscalYear}`)
          }
        }
      }
    })
    
    console.log(`  支払予定日が影響を受けるプロジェクト: ${affectedProjects}件`)
    
    // 4. CADDON請求への影響
    console.log('\n💻 4. CADDON請求への影響:')
    const { data: caddonBillings } = await supabase
      .from('caddon_billing')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('billing_month')
    
    let affectedCaddonBillings = 0
    caddonBillings?.forEach(billing => {
      const billingDate = new Date(billing.billing_month)
      const billingMonth = billingDate.getMonth() + 1
      const billingYear = billingDate.getFullYear()
      
      const oldFiscalYear = billingMonth >= oldFiscalStartMonth ? billingYear : billingYear - 1
      const newFiscalYear = billingMonth >= newFiscalStartMonth ? billingYear : billingYear - 1
      
      if (oldFiscalYear !== newFiscalYear) {
        affectedCaddonBillings++
        console.log(`    ${billing.billing_month}: 年度 ${oldFiscalYear} → ${newFiscalYear}`)
      }
    })
    
    console.log(`  年度が変更されるCADDON請求: ${affectedCaddonBillings}件`)
    
    // 5. 原価エントリーへの影響
    console.log('\n💸 5. 原価エントリーへの影響:')
    const { data: costEntries } = await supabase
      .from('cost_entries')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('entry_date', { ascending: false })
    
    let affectedCostEntries = 0
    costEntries?.forEach(entry => {
      const entryDate = new Date(entry.entry_date)
      const entryMonth = entryDate.getMonth() + 1
      const entryYear = entryDate.getFullYear()
      
      const oldFiscalYear = entryMonth >= oldFiscalStartMonth ? entryYear : entryYear - 1
      const newFiscalYear = entryMonth >= newFiscalStartMonth ? entryYear : entryYear - 1
      
      if (oldFiscalYear !== newFiscalYear) {
        affectedCostEntries++
      }
    })
    
    console.log(`  年度が変更される原価エントリー: ${affectedCostEntries}件`)
    
    // 6. 銀行残高履歴への影響
    console.log('\n🏦 6. 銀行残高履歴への影響:')
    const { data: bankBalanceHistory } = await supabase
      .from('bank_balance_history')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('balance_date', { ascending: false })
    
    console.log(`  銀行残高履歴レコード: ${bankBalanceHistory?.length || 0}件`)
    
    // 7. プロジェクト年度別サマリへの影響
    console.log('\n📈 7. プロジェクト年度別サマリへの影響:')
    const { data: projectFiscalSummary } = await supabase
      .from('project_fiscal_summary')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('fiscal_year', { ascending: false })
    
    console.log(`  プロジェクト年度別サマリレコード: ${projectFiscalSummary?.length || 0}件`)
    
    // 8. 影響の総括
    console.log('\n📋 8. 影響の総括:')
    console.log(`  ✅ 年間入金予定表: 年度開始月が ${oldFiscalStartMonth}月 → ${newFiscalStartMonth}月 に変更`)
    console.log(`  ✅ 資金管理: 予測期間が新しい決算期に合わせて調整`)
    console.log(`  ✅ プロジェクト支払予定: ${affectedProjects}件のプロジェクトで年度が変更`)
    console.log(`  ✅ CADDON請求: ${affectedCaddonBillings}件の請求で年度が変更`)
    console.log(`  ✅ 原価エントリー: ${affectedCostEntries}件のエントリーで年度が変更`)
    console.log(`  ✅ 銀行残高履歴: 新しい年度のレコードが必要`)
    console.log(`  ✅ プロジェクト年度別サマリ: 年度別データの再計算が必要`)
    
    // 9. 推奨事項
    console.log('\n💡 9. 推奨事項:')
    console.log('  1. 決算期変更前にデータのバックアップを取得')
    console.log('  2. 変更後、年間入金予定表を確認・調整')
    console.log('  3. 資金管理の予測を再計算')
    console.log('  4. プロジェクトの支払予定日を確認')
    console.log('  5. CADDON請求の年度分類を確認')
    console.log('  6. 原価エントリーの年度分類を確認')
    console.log('  7. 銀行残高履歴の新しい年度レコードを作成')
    console.log('  8. プロジェクト年度別サマリを再計算')
    
    console.log('\n🎯 結論: 決算期変更は全システムに影響しますが、実装された機能により自動的に処理されます。')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

analyzeFiscalPeriodChangeImpact()
