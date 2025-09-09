const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testAIChatAPIDetailed() {
  try {
    console.log('🔍 AIチャットAPI詳細テスト開始...\n')

    // 1. 環境変数の確認
    console.log('📋 1. 環境変数の確認:')
    const envVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY
    }
    
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        console.log(`  ✅ ${key}: 設定済み`)
      } else {
        console.log(`  ❌ ${key}: 未設定`)
      }
    })

    // 2. OpenAI APIキーの直接テスト
    console.log('\n📋 2. OpenAI APIキーの直接テスト:')
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          }
        })
        
        console.log(`  📡 OpenAI APIレスポンス: ${openaiResponse.status} ${openaiResponse.statusText}`)
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json()
          console.log(`  ✅ OpenAI API接続成功: ${data.data?.length || 0}個のモデル取得`)
        } else {
          const errorText = await openaiResponse.text()
          console.log(`  ❌ OpenAI API接続失敗: ${errorText}`)
        }
      } catch (error) {
        console.log(`  ❌ OpenAI API接続エラー: ${error.message}`)
      }
    } else {
      console.log('  ❌ OpenAI APIキーが設定されていません')
    }

    // 3. AIチャットAPIのテスト（認証なし）
    console.log('\n📋 3. AIチャットAPIのテスト（認証なし）:')
    try {
      const testMessage = {
        message: 'こんにちは、テストメッセージです。'
      }

      console.log('  📤 送信データ:', testMessage)

      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      })

      console.log(`  📡 レスポンスステータス: ${response.status} ${response.statusText}`)
      console.log(`  📡 レスポンスOK: ${response.ok}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('  ❌ エラーレスポンス:', errorText)
        
        try {
          const errorJson = JSON.parse(errorText)
          console.log('  ❌ エラーJSON:', errorJson)
        } catch (e) {
          console.log('  ❌ エラーテキスト（JSON解析失敗）:', errorText)
        }
      } else {
        const data = await response.json()
        console.log('  ✅ 成功レスポンス:', data)
      }
    } catch (error) {
      console.log(`  ❌ APIテストエラー: ${error.message}`)
    }

    // 4. 推奨される解決手順
    console.log('\n💡 4. 推奨される解決手順:')
    console.log('  1. 開発サーバーが起動していることを確認')
    console.log('  2. ブラウザでアプリケーションにログイン')
    console.log('  3. 開発者ツールのコンソールでサーバーログを確認')
    console.log('  4. AIアシスタントでメッセージを送信')
    console.log('  5. サーバーログで詳細なエラー情報を確認')

    // 5. デバッグ用の情報
    console.log('\n🔧 5. デバッグ用の情報:')
    console.log('  📋 サーバーログの確認方法:')
    console.log('    1. ターミナルで開発サーバーのログを確認')
    console.log('    2. ブラウザの開発者ツールでコンソールエラーを確認')
    console.log('    3. NetworkタブでAPIリクエストの詳細を確認')

    console.log('\n✅ 詳細テスト完了！')

  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testAIChatAPIDetailed()
