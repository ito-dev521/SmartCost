const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCaddonBillingTableStructure() {
  try {
    console.log('🔍 caddon_billingテーブルの構造確認開始...\n')
    
    // 1. テーブル構造の確認（サンプルデータから推測）
    console.log('📋 1. テーブル構造の確認:')
    const { data: sampleData, error: sampleError } = await supabase
      .from('caddon_billing')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.error('❌ サンプルデータ取得エラー:', sampleError)
      return
    }

    if (sampleData && sampleData.length > 0) {
      console.log('📊 利用可能なカラム:')
      const columns = Object.keys(sampleData[0])
      columns.forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]}`)
      })
      
      // amountカラムの存在確認
      const hasAmountColumn = columns.includes('amount')
      console.log(`\n📊 amountカラムの存在: ${hasAmountColumn ? '✅ 存在' : '❌ 不存在'}`)
      
      if (!hasAmountColumn) {
        console.log('\n⚠️  amountカラムが存在しません。')
        console.log('  以下のSQLを実行してカラムを追加してください:')
        console.log('')
        console.log('  ALTER TABLE caddon_billing ADD COLUMN amount NUMERIC DEFAULT 0;')
        console.log('')
        console.log('  その後、以下のSQLでデータを更新:')
        console.log('')
        console.log('  UPDATE caddon_billing SET amount = total_amount;')
      }
    }

    // 2. 現在のデータの確認
    console.log('\n📋 2. 現在のデータの確認:')
    const { data: allData, error: allError } = await supabase
      .from('caddon_billing')
      .select('id, billing_month, total_amount, amount')
      .order('billing_month', { ascending: false })

    if (allError) {
      console.error('❌ データ取得エラー:', allError)
      return
    }

    console.log(`📊 レコード数: ${allData?.length || 0}件`)
    
    if (allData && allData.length > 0) {
      console.log('\n📋 データ詳細:')
      allData.forEach((billing, index) => {
        console.log(`  ${index + 1}. ${billing.billing_month}: total_amount=${billing.total_amount}, amount=${billing.amount}`)
      })
    }

    // 3. 推奨修正手順
    console.log('\n📋 3. 推奨修正手順:')
    console.log('  1. amountカラムが存在しない場合は追加')
    console.log('  2. amountカラムをtotal_amountで更新')
    console.log('  3. データの整合性を確認')
    
    console.log('\n✅ caddon_billingテーブルの構造確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCaddonBillingTableStructure()
