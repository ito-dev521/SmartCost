const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateSampleCompanyFiscalYear() {
  try {
    console.log('🔍 サンプル建設コンサルタントの決算年度を更新開始...')
    
    // サンプル建設コンサルタントの会社ID
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    // 現在の決算情報を取得
    const { data: currentFiscalInfo, error: getError } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    if (getError && getError.code !== 'PGRST116') {
      console.error('❌ 決算情報取得エラー:', getError)
      return
    }
    
    if (currentFiscalInfo) {
      console.log('📋 現在の決算情報:')
      console.log(`  決算年度: ${currentFiscalInfo.fiscal_year}年`)
      console.log(`  決算月: ${currentFiscalInfo.settlement_month}月`)
      console.log(`  現在期間: ${currentFiscalInfo.current_period}期`)
      console.log(`  銀行残高: ${currentFiscalInfo.bank_balance?.toLocaleString() || 0}円`)
      
      // 決算年度を2025年に更新
      const { error: updateError } = await supabase
        .from('fiscal_info')
        .update({
          fiscal_year: 2025,
          current_period: 1
        })
        .eq('id', currentFiscalInfo.id)
      
      if (updateError) {
        console.error('❌ 決算情報更新エラー:', updateError)
        return
      }
      
      console.log('✅ 決算情報を更新しました:')
      console.log(`  決算年度: 2024年 → 2025年`)
      console.log(`  現在期間: ${currentFiscalInfo.current_period}期 → 1期`)
      
    } else {
      console.log('📋 決算情報が見つかりません。新規作成します。')
      
      // 新規決算情報を作成
      const { error: insertError } = await supabase
        .from('fiscal_info')
        .insert({
          company_id: sampleCompanyId,
          fiscal_year: 2025,
          settlement_month: 9,
          current_period: 1,
          bank_balance: 5000000,
          notes: 'サンプル建設コンサルタントの決算情報'
        })
      
      if (insertError) {
        console.error('❌ 決算情報作成エラー:', insertError)
        return
      }
      
      console.log('✅ 決算情報を新規作成しました:')
      console.log(`  決算年度: 2025年`)
      console.log(`  決算月: 9月`)
      console.log(`  現在期間: 1期`)
      console.log(`  銀行残高: 5,000,000円`)
    }
    
    // 更新後の決算情報を確認
    console.log('\n📊 更新後の決算情報確認:')
    const { data: updatedFiscalInfo } = await supabase
      .from('fiscal_info')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    if (updatedFiscalInfo) {
      console.log(`  決算年度: ${updatedFiscalInfo.fiscal_year}年`)
      console.log(`  決算月: ${updatedFiscalInfo.settlement_month}月`)
      console.log(`  現在期間: ${updatedFiscalInfo.current_period}期`)
      console.log(`  銀行残高: ${updatedFiscalInfo.bank_balance?.toLocaleString() || 0}円`)
      
      // 予測期間を計算
      const settlementMonth = updatedFiscalInfo.settlement_month
      const nextMonth = settlementMonth === 12 ? 1 : settlementMonth + 1
      const nextYear = settlementMonth === 12 ? updatedFiscalInfo.fiscal_year + 1 : updatedFiscalInfo.fiscal_year
      
      console.log(`\n📅 新しい予測期間: ${nextYear}年${nextMonth}月 から 12ヶ月間`)
      console.log(`  予測期間: ${nextYear}年${nextMonth}月 〜 ${nextYear + 1}年${nextMonth - 1}月`)
    }
    
    console.log('\n✅ 決算年度の更新が完了しました！')
    console.log('これで資金管理のグラフに収入予測が正しく反映されるはずです。')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

updateSampleCompanyFiscalYear()
