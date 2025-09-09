const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseAIAssistantIssues() {
  try {
    console.log('🔍 AIアシスタント問題診断開始...\n')
    
    // 1. 環境変数の確認
    console.log('📋 1. 環境変数の確認:')
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ]
    
    let envVarsOk = true
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      if (value) {
        console.log(`  ✅ ${envVar}: 設定済み`)
      } else {
        console.log(`  ❌ ${envVar}: 未設定`)
        envVarsOk = false
      }
    })
    
    if (!envVarsOk) {
      console.log('\n❌ 環境変数が不足しています。.env.localファイルを確認してください。')
      return
    }
    
    // 2. データベース接続の確認
    console.log('\n📋 2. データベース接続の確認:')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('  ❌ データベース接続エラー:', testError.message)
      return
    } else {
      console.log('  ✅ データベース接続: 正常')
    }
    
    // 3. ユーザーデータの確認
    console.log('\n📋 3. ユーザーデータの確認:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, company_id')
      .limit(3)
    
    if (usersError) {
      console.log('  ❌ ユーザーデータ取得エラー:', usersError.message)
    } else {
      console.log(`  ✅ ユーザーデータ: ${users?.length || 0}件取得`)
      users?.forEach((user, index) => {
        console.log(`    ${index + 1}. ${user.email} (${user.name}) - ${user.role}`)
      })
    }
    
    // 4. 会社データの確認
    console.log('\n📋 4. 会社データの確認:')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(3)
    
    if (companiesError) {
      console.log('  ❌ 会社データ取得エラー:', companiesError.message)
    } else {
      console.log(`  ✅ 会社データ: ${companies?.length || 0}件取得`)
      companies?.forEach((company, index) => {
        console.log(`    ${index + 1}. ${company.name} (${company.id})`)
      })
    }
    
    // 5. OpenAI APIキーの確認
    console.log('\n📋 5. OpenAI APIキーの確認:')
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      console.log(`  ✅ OpenAI APIキー: 設定済み (${openaiKey.substring(0, 10)}...)`)
      
      // OpenAI APIのテスト（実際のAPI呼び出しはしない）
      console.log('  📋 OpenAI APIキーの形式確認:')
      if (openaiKey.startsWith('sk-')) {
        console.log('    ✅ APIキーの形式: 正しい')
      } else {
        console.log('    ⚠️ APIキーの形式: 確認が必要 (sk-で始まる必要があります)')
      }
    } else {
      console.log('  ❌ OpenAI APIキー: 未設定')
    }
    
    // 6. 認証設定の確認
    console.log('\n📋 6. 認証設定の確認:')
    console.log('  📋 Supabase認証設定:')
    console.log(`    URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`    Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
    console.log(`    Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`)
    
    // 7. 問題の診断と解決策
    console.log('\n🔍 7. 問題の診断と解決策:')
    console.log('  📋 一般的な問題と解決策:')
    console.log('    1. 認証エラー (401):')
    console.log('       - ブラウザでアプリケーションにログイン')
    console.log('       - ページを再読み込み')
    console.log('       - ログアウトして再ログイン')
    console.log('')
    console.log('    2. OpenAI APIエラー:')
    console.log('       - OpenAI APIキーが正しく設定されているか確認')
    console.log('       - APIキーに十分なクレジットがあるか確認')
    console.log('       - ネットワーク接続を確認')
    console.log('')
    console.log('    3. サーバーエラー (500):')
    console.log('       - サーバーログを確認')
    console.log('       - 環境変数の設定を確認')
    console.log('       - データベース接続を確認')
    
    // 8. テスト手順
    console.log('\n🧪 8. テスト手順:')
    console.log('  1. ブラウザでアプリケーションを開く')
    console.log('  2. ログインページで認証')
    console.log('  3. ダッシュボードでAIアシスタントを開く')
    console.log('  4. 簡単なメッセージを送信')
    console.log('  5. ブラウザの開発者ツールでコンソールエラーを確認')
    console.log('  6. ネットワークタブでAPIリクエストを確認')
    
    console.log('\n✅ 診断完了！')
    
  } catch (error) {
    console.error('❌ 診断エラー:', error)
  }
}

diagnoseAIAssistantIssues()
