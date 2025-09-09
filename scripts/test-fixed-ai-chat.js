const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testFixedAIChat() {
  try {
    console.log('🔍 修正されたAIチャットAPIのテスト開始...\n')

    // 1. 直接OpenAI APIでgpt-4o-miniをテスト
    console.log('📋 1. gpt-4o-miniでの直接テスト:')
    
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'あなたは建設業向け原価管理システムのAIアシスタントです。'
            },
            {
              role: 'user',
              content: 'こんにちは、テストメッセージです。'
            }
          ],
          max_tokens: 100,
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

    // 2. 修正されたAIチャットAPIのテスト（認証なし）
    console.log('\n📋 2. 修正されたAIチャットAPIのテスト:')
    
    const testMessage = {
      message: 'こんにちは、テストメッセージです。'
    }

    console.log('  📤 送信データ:', testMessage)

    try {
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      })

      console.log(`  📡 レスポンスステータス: ${response.status} ${response.statusText}`)

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

    // 3. 次のステップ
    console.log('\n💡 3. 次のステップ:')
    console.log('  📋 修正内容:')
    console.log('    1. OpenAIモデルをgpt-4からgpt-4o-miniに変更')
    console.log('    2. 詳細なログ出力を追加')
    console.log('    3. エラーハンドリングを改善')
    console.log('')
    console.log('  📋 ブラウザでのテスト手順:')
    console.log('    1. ブラウザでアプリケーションにログイン')
    console.log('    2. AIアシスタントを開く')
    console.log('    3. メッセージを送信')
    console.log('    4. サーバーログで詳細な情報を確認')

    console.log('\n✅ 修正テスト完了！')

  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testFixedAIChat()
