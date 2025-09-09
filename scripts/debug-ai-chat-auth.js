const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugAIChatAuth() {
  try {
    console.log('🔍 AIチャット認証デバッグ開始...\n')
    
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
    
    // 2. Supabase接続テスト
    console.log('\n📋 2. Supabase接続テスト:')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('  ❌ Supabase接続エラー:', error.message)
      } else {
        console.log('  ✅ Supabase接続: 正常')
      }
    } catch (error) {
      console.log('  ❌ Supabase接続テストエラー:', error.message)
    }
    
    // 3. 認証状態の確認
    console.log('\n📋 3. 認証状態の確認:')
    
    // セッション確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.log('  ❌ セッション取得エラー:', sessionError.message)
    } else if (session) {
      console.log('  ✅ セッション存在:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at * 1000).toLocaleString('ja-JP')
      })
    } else {
      console.log('  ❌ セッションなし')
    }
    
    // ユーザー確認
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.log('  ❌ ユーザー取得エラー:', userError.message)
    } else if (user) {
      console.log('  ✅ ユーザー存在:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })
    } else {
      console.log('  ❌ ユーザーなし')
    }
    
    // 4. 認証エラーの原因分析
    console.log('\n🔍 4. 認証エラーの原因分析:')
    
    if (!session && !user) {
      console.log('  📋 原因: 認証セッションが存在しない')
      console.log('  💡 解決策:')
      console.log('    1. ブラウザでアプリケーションにアクセス')
      console.log('    2. ログインページで認証')
      console.log('    3. 認証後、AIアシスタントを試す')
    } else if (session && !user) {
      console.log('  📋 原因: セッションは存在するがユーザー情報が取得できない')
      console.log('  💡 解決策:')
      console.log('    1. ページを再読み込み')
      console.log('    2. ログアウトして再ログイン')
    } else if (!session && user) {
      console.log('  📋 原因: ユーザーは存在するがセッションが無効')
      console.log('  💡 解決策:')
      console.log('    1. セッションをリフレッシュ')
      console.log('    2. 再ログイン')
    } else {
      console.log('  ✅ 認証状態: 正常')
    }
    
    // 5. ブラウザでの確認手順
    console.log('\n🌐 5. ブラウザでの確認手順:')
    console.log('  1. ブラウザでアプリケーションを開く')
    console.log('  2. 開発者ツール（F12）を開く')
    console.log('  3. Application/Storage タブを選択')
    console.log('  4. Cookies セクションで以下を確認:')
    console.log('     - sb-access-token')
    console.log('     - sb-refresh-token')
    console.log('     - supabase-auth-token')
    console.log('  5. これらのクッキーが存在しない場合は再ログイン')
    
    // 6. ネットワークタブでの確認
    console.log('\n🌐 6. ネットワークタブでの確認:')
    console.log('  1. 開発者ツールのNetworkタブを開く')
    console.log('  2. AIアシスタントでメッセージを送信')
    console.log('  3. /api/ai-chat リクエストを確認')
    console.log('  4. リクエストヘッダーでCookieを確認')
    console.log('  5. レスポンスでエラー詳細を確認')
    
    // 7. 推奨される解決手順
    console.log('\n💡 7. 推奨される解決手順:')
    console.log('  1. ブラウザのクッキーをクリア')
    console.log('  2. アプリケーションを再読み込み')
    console.log('  3. ログインページで再認証')
    console.log('  4. ダッシュボードに移動')
    console.log('  5. AIアシスタントを開く')
    console.log('  6. 簡単なメッセージを送信')
    console.log('  7. エラーが続く場合はコンソールログを確認')
    
    console.log('\n✅ デバッグ完了！')
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error)
  }
}

debugAIChatAuth()
