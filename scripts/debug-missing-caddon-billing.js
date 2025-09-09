const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMissingCaddonBilling() {
  try {
    console.log('🔍 欠けているCADDON請求データの調査開始...\n')
    
    // テスト用の会社ID（サンプル建設コンサルタント）
    const testCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    // 1. すべてのCADDON請求データを取得（会社IDフィルタリングなし）
    console.log('📋 1. すべてのCADDON請求データ（会社IDフィルタリングなし）:')
    const { data: allCaddonBillings, error: allError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')

    if (allError) {
      console.error('❌ 全CADDON請求データ取得エラー:', allError)
      return
    }

    console.log(`📊 全CADDON請求レコード数: ${allCaddonBillings?.length || 0}件`)
    
    if (allCaddonBillings && allCaddonBillings.length > 0) {
      allCaddonBillings.forEach((billing, index) => {
        console.log(`  ${index + 1}. ${billing.billing_month}: amount=${billing.amount}, total_amount=${billing.total_amount}, company_id=${billing.company_id}`)
      })
    }

    // 2. 会社IDでフィルタリングしたデータ
    console.log('\n📋 2. 会社IDでフィルタリングしたCADDON請求データ:')
    const { data: filteredCaddonBillings, error: filteredError } = await supabase
      .from('caddon_billing')
      .select('*')
      .eq('company_id', testCompanyId)
      .order('billing_month')

    if (filteredError) {
      console.error('❌ フィルタリング済みCADDON請求データ取得エラー:', filteredError)
      return
    }

    console.log(`📊 フィルタリング済みCADDON請求レコード数: ${filteredCaddonBillings?.length || 0}件`)
    
    if (filteredCaddonBillings && filteredCaddonBillings.length > 0) {
      filteredCaddonBillings.forEach((billing, index) => {
        console.log(`  ${index + 1}. ${billing.billing_month}: amount=${billing.amount}, total_amount=${billing.total_amount}, company_id=${billing.company_id}`)
      })
    }

    // 3. 欠けているデータの特定
    console.log('\n📋 3. 欠けているデータの特定:')
    const allBillingMonths = allCaddonBillings?.map(b => b.billing_month) || []
    const filteredBillingMonths = filteredCaddonBillings?.map(b => b.billing_month) || []
    
    const missingMonths = allBillingMonths.filter(month => !filteredBillingMonths.includes(month))
    console.log(`📊 欠けている請求月: ${missingMonths.length > 0 ? missingMonths.join(', ') : 'なし'}`)
    
    if (missingMonths.length > 0) {
      console.log('\n📋 欠けているデータの詳細:')
      missingMonths.forEach(month => {
        const missingBilling = allCaddonBillings?.find(b => b.billing_month === month)
        if (missingBilling) {
          console.log(`  ${month}: amount=${missingBilling.amount}, total_amount=${missingBilling.total_amount}, company_id=${missingBilling.company_id}`)
        }
      })
    }

    // 4. 会社IDの確認
    console.log('\n📋 4. 会社IDの確認:')
    const uniqueCompanyIds = [...new Set(allCaddonBillings?.map(b => b.company_id) || [])]
    console.log(`📊 存在する会社ID: ${uniqueCompanyIds.join(', ')}`)
    console.log(`📊 テスト用会社ID: ${testCompanyId}`)
    console.log(`📊 テスト用会社IDが存在するか: ${uniqueCompanyIds.includes(testCompanyId) ? '✅ はい' : '❌ いいえ'}`)

    // 5. 特定の請求月のデータを確認
    console.log('\n📋 5. 特定の請求月のデータ確認:')
    const targetMonths = ['2025-11', '2026-02']
    
    targetMonths.forEach(month => {
      const billing = allCaddonBillings?.find(b => b.billing_month === month)
      if (billing) {
        console.log(`  ${month}: amount=${billing.amount}, total_amount=${billing.total_amount}, company_id=${billing.company_id}`)
      } else {
        console.log(`  ${month}: ❌ データが見つかりません`)
      }
    })

    console.log('\n✅ 欠けているCADDON請求データの調査完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

debugMissingCaddonBilling()
