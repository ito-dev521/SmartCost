const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testAIChatAPI() {
  try {
    console.log('🔍 AIチャットAPIのテスト開始...\n')

    // テスト用のメッセージ
    const testMessage = {
      message: 'こんにちは、テストメッセージです。'
    }

    console.log('📤 送信データ:', testMessage)

    // APIエンドポイントにリクエストを送信
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })

    console.log('📡 レスポンスステータス:', response.status)
    console.log('📡 レスポンスOK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ エラーレスポンス:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.log('❌ エラーJSON:', errorJson)
      } catch (e) {
        console.log('❌ エラーテキスト（JSON解析失敗）:', errorText)
      }
    } else {
      const data = await response.json()
      console.log('✅ 成功レスポンス:', data)
    }

  } catch (error) {
    console.error('❌ テストエラー:', error.message)
    console.error('❌ エラー詳細:', error)
  }
}

testAIChatAPI()
