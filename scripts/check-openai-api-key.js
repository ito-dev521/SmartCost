const fs = require('fs')
const path = require('path')

function checkOpenAIApiKey() {
  try {
    console.log('🔍 OpenAI APIキーの設定確認...\n')

    // .env.localファイルを読み込み
    const envPath = path.join(process.cwd(), '.env.local')
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.localファイルが存在しません')
      return
    }

    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    let hasOpenAIKey = false
    let hasSupabaseUrl = false
    let hasSupabaseAnonKey = false
    
    lines.forEach(line => {
      if (line.startsWith('OPENAI_API_KEY=')) {
        hasOpenAIKey = true
        const key = line.split('=')[1]
        if (key && key.trim() !== '') {
          console.log('✅ OPENAI_API_KEY: 設定済み')
        } else {
          console.log('❌ OPENAI_API_KEY: 空の値')
        }
      } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        hasSupabaseUrl = true
        console.log('✅ NEXT_PUBLIC_SUPABASE_URL: 設定済み')
      } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        hasSupabaseAnonKey = true
        console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: 設定済み')
      }
    })

    if (!hasOpenAIKey) {
      console.log('❌ OPENAI_API_KEY: 設定されていません')
      console.log('📋 .env.localファイルに以下を追加してください:')
      console.log('OPENAI_API_KEY=your_openai_api_key_here')
    }

    if (!hasSupabaseUrl) {
      console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 設定されていません')
    }

    if (!hasSupabaseAnonKey) {
      console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: 設定されていません')
    }

    console.log('\n📋 設定状況:')
    console.log(`  - OpenAI API Key: ${hasOpenAIKey ? '✅' : '❌'}`)
    console.log(`  - Supabase URL: ${hasSupabaseUrl ? '✅' : '❌'}`)
    console.log(`  - Supabase Anon Key: ${hasSupabaseAnonKey ? '✅' : '❌'}`)

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkOpenAIApiKey()
