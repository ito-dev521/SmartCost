const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testAuthFlow() {
  try {
    console.log('🔍 認証フローテスト開始...\n')
    
    // 1. 現在のセッション状態を確認
    console.log('📋 1. 現在のセッション状態:')
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
    
    // 2. 現在のユーザーを確認
    console.log('\n📋 2. 現在のユーザー:')
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
    
    // 3. 認証状態の詳細確認
    console.log('\n📋 3. 認証状態の詳細:')
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (currentUser) {
      console.log('  ✅ 認証済みユーザー:', currentUser.email)
      
      // ユーザーテーブルから詳細情報を取得
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, email, name, role, company_id')
        .eq('id', currentUser.id)
        .single()
      
      if (userDataError) {
        console.log('  ❌ ユーザーデータ取得エラー:', userDataError.message)
      } else {
        console.log('  ✅ ユーザーデータ:', {
          name: userData.name,
          role: userData.role,
          company_id: userData.company_id
        })
      }
    } else {
      console.log('  ❌ 認証されていません')
    }
    
    // 4. クッキーの確認（シミュレーション）
    console.log('\n📋 4. クッキー情報（シミュレーション）:')
    console.log('  📋 ブラウザでのクッキー確認が必要です')
    console.log('  📋 以下のクッキーが存在するか確認してください:')
    console.log('    - sb-access-token')
    console.log('    - sb-refresh-token')
    console.log('    - supabase-auth-token')
    
    // 5. 認証エラーの一般的な原因
    console.log('\n🔍 5. 認証エラーの一般的な原因:')
    console.log('  📋 1. セッションの期限切れ')
    console.log('    - 解決策: ページを再読み込みしてログインし直す')
    console.log('')
    console.log('  📋 2. クッキーの削除または無効化')
    console.log('    - 解決策: ブラウザのクッキーをクリアして再ログイン')
    console.log('')
    console.log('  📋 3. ミドルウェアの認証チェック')
    console.log('    - 解決策: ミドルウェアの設定を確認')
    console.log('')
    console.log('  📋 4. APIルートでの認証処理')
    console.log('    - 解決策: APIルートの認証ロジックを確認')
    
    // 6. 推奨される解決手順
    console.log('\n💡 6. 推奨される解決手順:')
    console.log('  1. ブラウザでアプリケーションを開く')
    console.log('  2. 開発者ツール（F12）を開く')
    console.log('  3. Application/Storage タブでクッキーを確認')
    console.log('  4. 認証関連のクッキーが存在するか確認')
    console.log('  5. 存在しない場合は、ログインページで再ログイン')
    console.log('  6. ログイン後、AIアシスタントを試す')
    console.log('  7. エラーが続く場合は、コンソールエラーを確認')
    
    // 7. デバッグ用の情報
    console.log('\n🔧 7. デバッグ用の情報:')
    console.log('  📋 Supabase設定:')
    console.log(`    URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`    Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
    
    console.log('\n✅ 認証フローテスト完了！')
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testAuthFlow()
