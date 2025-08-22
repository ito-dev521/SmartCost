#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetSuperAdminPassword() {
  const email = 'superadmin@example.com'
  const newPassword = 'admin'

  try {
    console.log('🔍 スーパー管理者ユーザーの作成/更新中...')

    // ユーザーの作成または更新を試行
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        name: 'スーパー管理者',
        role: 'super_admin'
      }
    })

    if (createError) {
      // ユーザーが既に存在する場合の処理
      if (createError.message.includes('already registered') || createError.message.includes('duplicate')) {
        console.log('📧 ユーザーが既に存在します')
        console.log('💡 手動でパスワードを更新してください:')
        console.log('1. Supabaseダッシュボードを開く')
        console.log('2. Authentication → Users に移動')
        console.log(`3. ${email} のユーザーを探す`)
        console.log('4. パスワードを "admin" に設定')

      } else {
        console.error('❌ ユーザー作成エラー:', createError.message)
        console.log('💡 環境変数が正しく設定されているか確認してください')
        return
      }
    } else {
      console.log('✅ スーパー管理者ユーザーを作成しました')
      console.log('📧 メール:', newUser.user.email)
      console.log('🔑 パスワード:', newPassword)
    }

    // super_adminsテーブルに登録（既に存在する場合は無視）
    console.log('📝 スーパー管理者テーブルに登録中...')
    const { error: insertError } = await supabase
      .from('super_admins')
      .upsert([{
        email: email,
        name: 'スーパー管理者',
        password_hash: '$2b$10$demo.hash.for.super.admin.only',
        is_active: true
      }], {
        onConflict: 'email',
        ignoreDuplicates: false
      })

    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('❌ スーパー管理者テーブル登録エラー:', insertError.message)
    } else {
      console.log('✅ スーパー管理者テーブルに登録しました')
    }

    console.log('\n🎉 スーパー管理者セットアップが完了しました！')
    console.log('\n📋 ログイン情報:')
    console.log(`   メール: ${email}`)
    console.log(`   パスワード: ${newPassword}`)
    console.log(`   ログインURL: http://localhost:3001/login`)
    console.log(`   スーパー管理者パネル: http://localhost:3001/super-admin`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message)
    console.log('\n💡 トラブルシューティング:')
    console.log('1. 環境変数が正しく設定されているか確認してください')
    console.log('2. Supabaseサービスロールキーが正しいか確認してください')
    console.log('3. Supabaseダッシュボードで直接ユーザーを管理してください')
  }
}

// スクリプト実行
if (require.main === module) {
  resetSuperAdminPassword()
}

module.exports = { resetSuperAdminPassword }
