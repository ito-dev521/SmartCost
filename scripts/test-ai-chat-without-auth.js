const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testAIChatWithoutAuth() {
  try {
    console.log('🔍 認証なしAIチャットテスト開始...\n')

    // 1. テスト用のAIチャットAPIエンドポイントを作成
    console.log('📋 1. 認証なしAIチャットAPIのテスト:')
    
    const testMessage = {
      message: 'こんにちは、テストメッセージです。'
    }

    console.log('  📤 送信データ:', testMessage)

    // 2. 直接OpenAI APIを呼び出し
    console.log('\n📋 2. 直接OpenAI API呼び出し:')
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'あなたは建設業向け原価管理システムのAIアシスタントです。'
            },
            {
              role: 'user',
              content: testMessage.message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      console.log(`  📡 OpenAI APIレスポンス: ${openaiResponse.status} ${openaiResponse.statusText}`)

      if (openaiResponse.ok) {
        const data = await openaiResponse.json()
        const response = data.choices[0]?.message?.content
        console.log('  ✅ OpenAI API成功:')
        console.log(`  📝 レスポンス: ${response}`)
      } else {
        const errorText = await openaiResponse.text()
        console.log('  ❌ OpenAI API失敗:', errorText)
      }
    } catch (error) {
      console.log(`  ❌ OpenAI API呼び出しエラー: ${error.message}`)
    }

    // 3. 認証問題の解決策
    console.log('\n💡 3. 認証問題の解決策:')
    console.log('  📋 認証エラーの原因:')
    console.log('    1. ブラウザでのセッションが無効')
    console.log('    2. クッキーが正しく送信されていない')
    console.log('    3. ミドルウェアでの認証チェック')
    console.log('')
    console.log('  📋 解決手順:')
    console.log('    1. ブラウザでアプリケーションにアクセス')
    console.log('    2. ログインページで認証')
    console.log('    3. 認証後、AIアシスタントを試す')
    console.log('    4. エラーが続く場合は、ブラウザのクッキーをクリア')

    // 4. デバッグ用の情報
    console.log('\n🔧 4. デバッグ用の情報:')
    console.log('  📋 ブラウザでの確認手順:')
    console.log('    1. 開発者ツール（F12）を開く')
    console.log('    2. Application/Storage タブでクッキーを確認')
    console.log('    3. NetworkタブでAPIリクエストを確認')
    console.log('    4. コンソールでエラーログを確認')

    console.log('\n✅ 認証なしテスト完了！')

  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testAIChatWithoutAuth()
