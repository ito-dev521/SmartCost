require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCaddonBillingSchema() {
  try {
    console.log('🔍 CADDON請求テーブルのスキーマを確認中...')
    
    // テーブルに直接アクセスしてエラーを確認
    const { data, error } = await supabase
      .from('caddon_billing')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ テーブルアクセスエラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return
    }
    
    console.log('✅ caddon_billingテーブルにアクセス可能です')
    
    // 空のレコードを挿入してテスト（ロールバック）
    console.log('\n🧪 テーブル構造をテスト中...')
    
    const testData = {
      project_id: '00000000-0000-0000-0000-000000000000', // ダミーID
      client_id: '00000000-0000-0000-0000-000000000000', // ダミーID
      billing_month: '2024-01',
      caddon_usage_fee: 100000,
      initial_setup_fee: 50000,
      support_fee: 25000,
      total_amount: 175000,
      billing_status: 'pending',
      notes: 'テスト用'
    }
    
    console.log('テストデータ:', testData)
    
    // 実際のデータを取得して構造を確認
    const { data: realData, error: realError } = await supabase
      .from('caddon_billing')
      .select('*')
      .limit(5)
    
    if (realError) {
      console.error('データ取得エラー:', realError)
    } else if (realData && realData.length > 0) {
      console.log('\n📊 実際のデータ構造:')
      console.log('利用可能なカラム:', Object.keys(realData[0]))
      console.log('\nサンプルデータ:')
      console.log(JSON.stringify(realData[0], null, 2))
    } else {
      console.log('\n📊 テーブルは空です')
    }
    
  } catch (error) {
    console.error('予期しないエラー:', error)
  }
}

checkCaddonBillingSchema()
