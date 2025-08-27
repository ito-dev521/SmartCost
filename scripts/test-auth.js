#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAuthentication() {
  const email = 'superadmin@example.com'
  const password = 'admin'

  try {
    console.log('🔍 Supabase認証テストを開始...')

    // 1. ユーザーが存在するか確認
    console.log('\n📧 ユーザーの存在確認:')
    try {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

      if (listError) {
        console.error('❌ ユーザー一覧取得エラー:', listError.message)
      } else {
        const user = authUsers.users.find(u => u.email === email)
        if (user) {
          console.log('✅ ユーザー存在:', user.email)
          console.log('   ユーザーID:', user.id)
          console.log('   メール確認済み:', user.email_confirmed_at ? 'はい' : 'いいえ')
          console.log('   作成日:', user.created_at)
        } else {
          console.log('❌ ユーザーが見つかりません')
        }
      }
    } catch (error) {
      console.error('❌ ユーザー確認エラー:', error.message)
    }

    // 2. ログイン試行
    console.log('\n🔐 ログイン試行:')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (signInError) {
      console.error('❌ ログインエラー:', signInError.message)
    } else {
      console.log('✅ ログイン成功!')
      console.log('   ユーザーID:', signInData.user?.id)
      console.log('   メール:', signInData.user?.email)
      console.log('   アクセストークン:', signInData.session?.access_token ? '存在' : 'なし')
    }

    // 3. スーパー管理者テーブル確認
    console.log('\n👑 スーパー管理者テーブル確認:')
    try {
      const { data: superAdmins, error: superAdminError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)

      if (superAdminError) {
        console.error('❌ スーパー管理者テーブルエラー:', superAdminError.message)
      } else {
        if (superAdmins && superAdmins.length > 0) {
          console.log('✅ スーパー管理者レコード存在:', superAdmins[0].name)
          console.log('   アクティブ:', superAdmins[0].is_active ? 'はい' : 'いいえ')
        } else {
          console.log('❌ スーパー管理者レコードなし')
        }
      }
    } catch (error) {
      console.error('❌ スーパー管理者確認エラー:', error.message)
    }

  } catch (error) {
    console.error('❌ テストエラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  testAuthentication()
}

module.exports = { testAuthentication }









