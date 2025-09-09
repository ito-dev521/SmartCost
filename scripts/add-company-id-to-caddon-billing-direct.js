const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addCompanyIdToCaddonBillingDirect() {
  try {
    console.log('🔍 caddon_billingテーブルにcompany_idカラムを追加開始...')
    
    // 1. 既存のCADDON請求データを取得
    console.log('📋 既存のCADDON請求データを取得中...')
    const { data: caddonBillings, error: fetchError } = await supabase
      .from('caddon_billing')
      .select('id, project_id, billing_month, total_amount')
    
    if (fetchError) {
      console.error('❌ CADDON請求データ取得エラー:', fetchError)
      return
    }
    
    console.log(`📋 ${caddonBillings?.length || 0}件のCADDON請求データを処理中...`)
    
    // 2. 各CADDON請求データのプロジェクトから会社IDを取得して更新
    for (const billing of caddonBillings || []) {
      console.log(`🔄 処理中: ${billing.billing_month} (${billing.total_amount}円)`)
      
      // プロジェクトから会社IDを取得
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('company_id, name, business_number')
        .eq('id', billing.project_id)
        .single()
      
      if (projectError || !project) {
        console.error(`❌ プロジェクト取得エラー (${billing.id}):`, projectError)
        continue
      }
      
      console.log(`  📋 プロジェクト: ${project.business_number} - ${project.name}`)
      console.log(`  🏢 会社ID: ${project.company_id}`)
      
      // CADDON請求データのcompany_idを更新（upsertを使用）
      const { error: updateError } = await supabase
        .from('caddon_billing')
        .upsert({
          id: billing.id,
          project_id: billing.project_id,
          billing_month: billing.billing_month,
          total_amount: billing.total_amount,
          company_id: project.company_id
        })
      
      if (updateError) {
        console.error(`❌ CADDON請求データ更新エラー (${billing.id}):`, updateError)
      } else {
        console.log(`✅ CADDON請求データ更新完了 (${billing.id})`)
      }
    }
    
    console.log('✅ caddon_billingテーブルのcompany_id設定完了！')
    
    // 3. 結果確認
    console.log('\n📊 設定後のCADDON請求データ確認:')
    const { data: updatedBillings, error: checkError } = await supabase
      .from('caddon_billing')
      .select('id, project_id, billing_month, total_amount, company_id')
      .order('billing_month')
    
    if (checkError) {
      console.error('❌ 確認用データ取得エラー:', checkError)
      return
    }
    
    const companyMap = new Map()
    updatedBillings?.forEach(billing => {
      if (!companyMap.has(billing.company_id)) {
        companyMap.set(billing.company_id, [])
      }
      companyMap.get(billing.company_id).push(billing)
    })
    
    companyMap.forEach((billings, companyId) => {
      const companyName = companyId === '4440fcae-03f2-4b0c-8c55-e19017ce08c9' 
        ? 'サンプル建設コンサルタント株式会社' 
        : companyId === '433f167b-e456-42e9-8dcd-9bcbe96d7678'
        ? 'テスト会社10'
        : '不明'
      console.log(`${companyName}: ${billings.length}件`)
      const totalAmount = billings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`  合計金額: ${totalAmount.toLocaleString()}円`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

addCompanyIdToCaddonBillingDirect()
