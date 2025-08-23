const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixCompanyIds() {
  try {
    console.log('🔍 既存のクライアントのcompany_idを修正開始...')

    // 既存のクライアントを取得
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, company_id')

    if (fetchError) {
      console.error('❌ クライアント取得エラー:', fetchError)
      return
    }

    console.log(`📋 取得したクライアント数: ${clients.length}`)

    // 各クライアントに一意のcompany_idを設定
    for (const client of clients) {
      if (client.company_id === '00000000-0000-0000-0000-000000000000') {
        const uniqueCompanyId = crypto.randomUUID()
        
        console.log(`🔄 クライアント「${client.name}」のcompany_idを更新: ${uniqueCompanyId}`)
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({ company_id: uniqueCompanyId })
          .eq('id', client.id)

        if (updateError) {
          console.error(`❌ クライアント「${client.name}」の更新エラー:`, updateError)
        } else {
          console.log(`✅ クライアント「${client.name}」の更新完了`)
        }
      } else {
        console.log(`ℹ️ クライアント「${client.name}」は既に一意のcompany_idを持っています: ${client.company_id}`)
      }
    }

    console.log('🎉 すべてのクライアントのcompany_id修正完了！')

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

// スクリプト実行
fixCompanyIds()
