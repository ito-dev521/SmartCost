const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// コマンドライン引数からメールアドレスを取得
const targetEmail = process.argv[2]

if (!targetEmail) {
  console.error('❌ メールアドレスを指定してください')
  console.log('使用例: node scripts/make-user-admin.js user@example.com')
  process.exit(1)
}

async function makeUserAdmin() {
  try {
    console.log(`🔍 ユーザー "${targetEmail}" を管理者に変更中...`)
    
    // 現在のユーザー情報を確認
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single()

    if (fetchError) {
      console.error('❌ ユーザーが見つかりません:', fetchError.message)
      return
    }

    console.log(`📋 現在のユーザー情報:`)
    console.log(`   メール: ${currentUser.email}`)
    console.log(`   名前: ${currentUser.name}`)
    console.log(`   現在のロール: ${currentUser.role}`)
    console.log(`   ID: ${currentUser.id}`)

    if (currentUser.role === 'admin') {
      console.log('✅ 既に管理者です')
      return
    }

    // ユーザーを管理者に更新
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', targetEmail)
      .select()
      .single()

    if (updateError) {
      console.error('❌ 管理者権限の付与に失敗:', updateError.message)
      return
    }

    console.log('✅ 管理者権限を付与しました')
    console.log(`📋 更新後のユーザー情報:`)
    console.log(`   メール: ${updatedUser.email}`)
    console.log(`   名前: ${updatedUser.name}`)
    console.log(`   ロール: ${updatedUser.role}`)
    console.log(`   ID: ${updatedUser.id}`)

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

makeUserAdmin()



