const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugClients() {
  try {
    console.log('🔍 クライアントテーブルデバッグを開始...')

    // クライアントテーブルの全レコードを取得
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('*')

    if (fetchError) {
      console.error('❌ クライアント取得エラー:', fetchError)
      return
    }

    console.log(`📋 クライアントテーブル全レコード数: ${clients.length}`)

    if (clients.length === 0) {
      console.log('ℹ️ クライアントテーブルにレコードがありません')
      return
    }

    // 各クライアントの詳細を表示
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. クライアント「${client.name}」:`)
      console.log(`   ID: ${client.id}`)
      console.log(`   company_id: ${client.company_id}`)
      console.log(`   電話番号: ${client.phone || '未設定'}`)
      console.log(`   住所: ${client.address || '未設定'}`)
      console.log(`   作成日: ${client.created_at}`)
      console.log(`   更新日: ${client.updated_at}`)
    })

    // 特定のクライアントIDで検索テスト
    if (clients.length > 0) {
      const testClientId = clients[0].id
      console.log(`\n🔍 クライアントID「${testClientId}」での検索テスト:`)

      const { data: singleClient, error: singleError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single()

      if (singleError) {
        console.error('❌ 単一クライアント取得エラー:', singleError)
      } else {
        console.log('✅ 単一クライアント取得成功:', singleClient.name)
      }

      // company_idでの検索テスト
      const testCompanyId = clients[0].company_id
      console.log(`\n🔍 company_id「${testCompanyId}」での検索テスト:`)

      const { data: companyClients, error: companyError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', testCompanyId)

      if (companyError) {
        console.error('❌ company_id検索エラー:', companyError)
      } else {
        console.log(`✅ company_id検索成功: ${companyClients.length}件`)
      }
    }

    console.log('\n🎉 クライアントテーブルデバッグ完了！')

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

// スクリプト実行
debugClients()


