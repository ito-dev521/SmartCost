const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateClientPaymentInfo() {
  try {
    console.log('🔍 クライアントの支払情報を更新開始...')
    
    // テスト会社10のクライアントを取得
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678'
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .order('name')
    
    if (clientsError) {
      console.error('❌ クライアント取得エラー:', clientsError)
      return
    }
    
    console.log(`📋 取得したクライアント: ${clients?.length || 0}件`)
    
    for (const client of clients || []) {
      console.log(`🔄 クライアント更新: ${client.name}`)
      
      // ケセラセラ株式会社の支払情報を設定
      if (client.name === 'ケセラセラ株式会社') {
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            payment_cycle: 'monthly', // 月次支払い
            payment_day: 25 // 25日支払い
          })
          .eq('id', client.id)
        
        if (updateError) {
          console.error(`❌ クライアント更新エラー (${client.name}):`, updateError)
        } else {
          console.log(`✅ クライアント更新完了: ${client.name}`)
          console.log(`   支払サイクル: 月次`)
          console.log(`   支払日: 25日`)
        }
      }
    }
    
    console.log('✅ クライアントの支払情報更新完了！')
    
    // 結果確認
    console.log('\n📊 更新後のクライアント情報:')
    const { data: updatedClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .order('name')
    
    updatedClients?.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name}`)
      console.log(`     支払サイクル: ${client.payment_cycle || '未設定'}`)
      console.log(`     支払日: ${client.payment_day || '未設定'}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

updateClientPaymentInfo()
