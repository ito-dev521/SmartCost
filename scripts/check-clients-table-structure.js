const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkClientsTableStructure() {
  try {
    console.log('🔍 clientsテーブルの構造を確認中...')
    
    // テスト会社10のクライアントを取得
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678'
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .limit(1)
    
    if (clientsError) {
      console.error('❌ クライアント取得エラー:', clientsError)
      return
    }
    
    if (clients && clients.length > 0) {
      console.log('📋 clientsテーブルのカラム一覧:')
      const client = clients[0]
      Object.keys(client).forEach(key => {
        console.log(`  - ${key}: ${typeof client[key]} = ${client[key]}`)
      })
    } else {
      console.log('📋 クライアントデータが見つかりません')
    }
    
    // サンプル建設コンサルタントのクライアントも確認
    const sampleCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    const { data: sampleClients, error: sampleError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', sampleCompanyId)
      .limit(1)
    
    if (sampleError) {
      console.error('❌ サンプル会社のクライアント取得エラー:', sampleError)
    } else if (sampleClients && sampleClients.length > 0) {
      console.log('\n📋 サンプル建設コンサルタントのクライアント例:')
      const sampleClient = sampleClients[0]
      Object.keys(sampleClient).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleClient[key]} = ${sampleClient[key]}`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkClientsTableStructure()
