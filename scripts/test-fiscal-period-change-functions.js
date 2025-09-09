const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFiscalPeriodChangeFunctions() {
  try {
    console.log('🔍 決算期変更機能のテスト開始...')
    
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
    
    // 影響分析関数をテスト
    console.log('\n🔍 影響分析関数のテスト...')
    const { data: impactAnalysis, error: analysisError } = await supabase
      .rpc('analyze_fiscal_period_change_impact', {
        p_company_id: sampleCompanyId,
        p_from_fiscal_year: currentFiscalInfo.fiscal_year,
        p_from_settlement_month: currentFiscalInfo.settlement_month,
        p_to_fiscal_year: currentFiscalInfo.fiscal_year + 1,
        p_to_settlement_month: 10
      })
    
    if (analysisError) {
      console.error('❌ 影響分析関数エラー:', analysisError)
      
      // 関数が存在するかチェック
      console.log('\n🔍 関数の存在確認...')
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'analyze_fiscal_period_change_impact')
      
      if (funcError) {
        console.error('❌ 関数確認エラー:', funcError)
      } else {
        console.log('📋 関数確認結果:', functions)
      }
      
      return
    }
    
    console.log('✅ 影響分析結果:')
    console.log(`  プロジェクト数: ${impactAnalysis.project_count}`)
    console.log(`  収入影響: ¥${impactAnalysis.revenue_impact?.toLocaleString() || 0}`)
    console.log(`  原価影響: ¥${impactAnalysis.cost_impact?.toLocaleString() || 0}`)
    console.log('  推奨事項:')
    impactAnalysis.recommendations?.forEach((rec, index) => {
      console.log(`    ${index + 1}. ${rec}`)
    })
    
    // 決算期変更履歴テーブルの存在確認
    console.log('\n🔍 決算期変更履歴テーブルの確認...')
    const { data: changes, error: changesError } = await supabase
      .from('fiscal_period_changes')
      .select('*')
      .limit(1)
    
    if (changesError) {
      console.error('❌ 決算期変更履歴テーブルエラー:', changesError)
      console.log('📋 テーブルが存在しない可能性があります')
    } else {
      console.log('✅ 決算期変更履歴テーブルは存在します')
      console.log(`  レコード数: ${changes?.length || 0}`)
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testFiscalPeriodChangeFunctions()
