const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCurrentLoggedInUser() {
  try {
    console.log('🔍 現在ログインしているユーザーの確認...\n')

    // 注意: このスクリプトはサーバーサイドで実行されるため、
    // 実際のユーザーセッションは取得できません
    // 代わりに、APIエンドポイントをテストします

    console.log('📋 現在のSupabaseクライアント設定:')
    console.log(`  - URL: ${supabaseUrl}`)
    console.log(`  - Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)

    // APIエンドポイントをテスト
    console.log('\n🔍 /api/bank-balance-history エンドポイントのテスト...')
    
    const response = await fetch('http://localhost:3000/api/bank-balance-history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 認証クッキーは含まれないため、401エラーが期待される
    })

    console.log(`📡 レスポンスステータス: ${response.status}`)
    
    if (response.status === 401) {
      console.log('✅ 期待される動作: 認証が必要なエラーが返されました')
    } else {
      const data = await response.json()
      console.log('📊 レスポンスデータ:', data)
    }

    console.log('\n📋 問題の分析:')
    console.log('1. データベースには6件の銀行残高履歴が存在')
    console.log('2. 会社ID 4440fcae-03f2-4b0c-8c55-e19017ce08c9 に属している')
    console.log('3. 現在ログインしているユーザーのcompany_idがnullの場合、データが表示されない')
    console.log('4. 新規法人のユーザーはcompany_idが設定されていない可能性がある')

    console.log('\n💡 解決策:')
    console.log('1. 現在ログインしているユーザーのcompany_idを確認')
    console.log('2. company_idがnullの場合は、適切な会社に所属させる')
    console.log('3. または、新規法人の場合は新しい銀行残高履歴を作成する')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkCurrentLoggedInUser()
