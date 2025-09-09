const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCaddonBillingConsistency() {
  try {
    console.log('🔍 CADDON請求データの整合性チェック開始...\n')
    
    // 1. CADDON請求データの確認
    console.log('📋 1. CADDON請求データの確認:')
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month', { ascending: false })

    if (caddonError) {
      console.error('❌ CADDON請求データ取得エラー:', caddonError)
      return
    }

    console.log(`📊 CADDON請求レコード数: ${caddonBillings?.length || 0}件`)
    
    if (caddonBillings && caddonBillings.length > 0) {
      console.log('\n📋 CADDON請求データ詳細:')
      caddonBillings.forEach((billing, index) => {
        console.log(`\n--- 請求 ${index + 1} ---`)
        console.log(`ID: ${billing.id}`)
        console.log(`プロジェクトID: ${billing.project_id}`)
        console.log(`請求月: ${billing.billing_month}`)
        console.log(`CADDON利用料: ${billing.caddon_usage_fee || 0}円`)
        console.log(`初期設定料: ${billing.initial_setup_fee || 0}円`)
        console.log(`サポート料: ${billing.support_fee || 0}円`)
        console.log(`合計金額 (total_amount): ${billing.total_amount || 0}円`)
        console.log(`金額 (amount): ${billing.amount || 0}円`)
        console.log(`請求ステータス: ${billing.billing_status}`)
        console.log(`作成日: ${billing.created_at}`)
        console.log(`更新日: ${billing.updated_at}`)
        
        // 手動計算との比較
        const manualTotal = (billing.caddon_usage_fee || 0) + (billing.initial_setup_fee || 0) + (billing.support_fee || 0)
        console.log(`手動計算合計: ${manualTotal}円`)
        
        if (billing.total_amount !== manualTotal) {
          console.log(`⚠️  合計金額の不一致: total_amount(${billing.total_amount}) ≠ 手動計算(${manualTotal})`)
        }
        
        if (billing.total_amount !== billing.amount) {
          console.log(`⚠️  total_amountとamountの不一致: total_amount(${billing.total_amount}) ≠ amount(${billing.amount})`)
        }
      })
    }

    // 2. プロジェクトデータの確認
    console.log('\n📋 2. CADDONプロジェクトの確認:')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .or('name.ilike.%CADDON%,business_number.ilike.C%')

    if (projectsError) {
      console.error('❌ プロジェクトデータ取得エラー:', projectsError)
      return
    }

    console.log(`📊 CADDONプロジェクト数: ${projects?.length || 0}件`)
    
    if (projects && projects.length > 0) {
      projects.forEach((project, index) => {
        console.log(`\n--- プロジェクト ${index + 1} ---`)
        console.log(`ID: ${project.id}`)
        console.log(`名前: ${project.name}`)
        console.log(`業務番号: ${project.business_number}`)
        console.log(`契約金額: ${project.contract_amount || 0}円`)
        console.log(`会社ID: ${project.company_id}`)
      })
    }

    // 3. 年間入金予定表での計算方法の確認
    console.log('\n📋 3. 年間入金予定表での計算方法:')
    console.log('  📊 使用フィールド: billing.total_amount || billing.amount || 0')
    console.log('  📊 CADDON管理での表示: total_amountフィールド')
    console.log('  📊 手動計算: caddon_usage_fee + initial_setup_fee + support_fee')
    
    // 4. データの整合性チェック
    console.log('\n📋 4. データ整合性チェック:')
    let inconsistentRecords = 0
    let missingTotalAmount = 0
    let missingAmount = 0
    
    if (caddonBillings) {
      caddonBillings.forEach(billing => {
        const manualTotal = (billing.caddon_usage_fee || 0) + (billing.initial_setup_fee || 0) + (billing.support_fee || 0)
        
        if (billing.total_amount !== manualTotal) {
          inconsistentRecords++
        }
        
        if (!billing.total_amount) {
          missingTotalAmount++
        }
        
        if (!billing.amount) {
          missingAmount++
        }
      })
    }
    
    console.log(`  ❌ 合計金額不一致レコード: ${inconsistentRecords}件`)
    console.log(`  ❌ total_amount未設定レコード: ${missingTotalAmount}件`)
    console.log(`  ❌ amount未設定レコード: ${missingAmount}件`)
    
    // 5. 推奨修正方法
    console.log('\n📋 5. 推奨修正方法:')
    if (inconsistentRecords > 0 || missingTotalAmount > 0) {
      console.log('  🔧 以下のSQLを実行してデータを修正:')
      console.log('')
      console.log('  UPDATE caddon_billing')
      console.log('  SET total_amount = caddon_usage_fee + initial_setup_fee + support_fee')
      console.log('  WHERE total_amount IS NULL OR total_amount != (caddon_usage_fee + initial_setup_fee + support_fee);')
      console.log('')
      console.log('  UPDATE caddon_billing')
      console.log('  SET amount = total_amount')
      console.log('  WHERE amount IS NULL OR amount != total_amount;')
    } else {
      console.log('  ✅ データは整合性が取れています')
    }
    
    console.log('\n✅ CADDON請求データの整合性チェック完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCaddonBillingConsistency()
