const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAIChatAuth() {
  try {
    console.log('🔍 AIチャット認証テスト開始...')
    
    // 1. ユーザー一覧を取得
    console.log('\n📋 1. ユーザー一覧:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, company_id')
      .limit(5)
    
    if (usersError) {
      console.error('❌ ユーザー取得エラー:', usersError)
    } else {
      console.log(`  取得ユーザー数: ${users?.length || 0}件`)
      users?.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.name}) - ${user.role}`)
        console.log(`     会社ID: ${user.company_id}`)
      })
    }
    
    // 2. 認証セッションの確認
    console.log('\n🔐 2. 認証セッション確認:')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError)
    } else if (session) {
      console.log('✅ セッション存在:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at * 1000).toLocaleString('ja-JP')
      })
    } else {
      console.log('❌ セッションなし')
    }
    
    // 3. 現在のユーザー確認
    console.log('\n👤 3. 現在のユーザー確認:')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError)
    } else if (user) {
      console.log('✅ 現在のユーザー:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })
    } else {
      console.log('❌ ユーザーなし')
    }
    
    // 4. 会社情報確認
    console.log('\n🏢 4. 会社情報確認:')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .limit(5)
    
    if (companiesError) {
      console.error('❌ 会社取得エラー:', companiesError)
    } else {
      console.log(`  取得会社数: ${companies?.length || 0}件`)
      companies?.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name} (${company.id})`)
      })
    }
    
    // 5. AIチャットAPIの認証テスト
    console.log('\n🤖 5. AIチャットAPI認証テスト:')
    
    // テスト用のユーザーでログインをシミュレート
    const testUser = users?.[0]
    if (testUser) {
      console.log(`  テストユーザー: ${testUser.email}`)
      
      // 実際のAPIテストは認証が必要なので、認証情報を確認
      console.log('  ⚠️ 実際のAPIテストにはブラウザでの認証が必要です')
      console.log('  📋 ブラウザでログイン後、AIアシスタントを試してください')
    } else {
      console.log('  ❌ テスト用ユーザーが見つかりません')
    }
    
    // 6. 推奨事項
    console.log('\n💡 6. 推奨事項:')
    console.log('  1. ブラウザでアプリケーションにログイン')
    console.log('  2. AIアシスタントを開く')
    console.log('  3. メッセージを送信してテスト')
    console.log('  4. ブラウザの開発者ツールでコンソールエラーを確認')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testAIChatAuth()
