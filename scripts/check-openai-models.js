const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function checkOpenAIModels() {
  try {
    console.log('🔍 OpenAI利用可能モデル確認開始...\n')

    // 1. 利用可能なモデル一覧を取得
    console.log('📋 1. 利用可能なモデル一覧:')
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      const models = data.data || []
      
      console.log(`  📊 総モデル数: ${models.length}個`)
      console.log('  📋 チャット用モデル:')
      
      // GPT-4系のモデルを探す
      const gpt4Models = models.filter(model => 
        model.id.includes('gpt-4') || model.id.includes('gpt-3.5')
      )
      
      gpt4Models.forEach(model => {
        console.log(`    - ${model.id} (${model.owned_by})`)
      })
      
      // 推奨モデルを特定
      console.log('\n  💡 推奨モデル:')
      const recommendedModels = [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo'
      ]
      
      recommendedModels.forEach(modelId => {
        const model = models.find(m => m.id === modelId)
        if (model) {
          console.log(`    ✅ ${modelId}: 利用可能`)
        } else {
          console.log(`    ❌ ${modelId}: 利用不可`)
        }
      })
      
    } else {
      const errorText = await response.text()
      console.log(`  ❌ モデル一覧取得失敗: ${errorText}`)
    }

    // 2. 推奨モデルでテスト
    console.log('\n📋 2. 推奨モデルでのテスト:')
    
    const testModels = ['gpt-4o-mini', 'gpt-3.5-turbo']
    
    for (const modelId of testModels) {
      console.log(`\n  🧪 ${modelId}でのテスト:`)
      
      try {
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
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

        if (testResponse.ok) {
          const data = await testResponse.json()
          const response = data.choices[0]?.message?.content
          console.log(`    ✅ ${modelId}: 成功`)
          console.log(`    📝 レスポンス: ${response?.substring(0, 50)}...`)
        } else {
          const errorText = await testResponse.text()
          console.log(`    ❌ ${modelId}: 失敗 - ${errorText}`)
        }
      } catch (error) {
        console.log(`    ❌ ${modelId}: エラー - ${error.message}`)
      }
    }

    console.log('\n✅ モデル確認完了！')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkOpenAIModels()
