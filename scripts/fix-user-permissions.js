#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixUserPermissions() {
  const email = 'superadmin@example.com'

  try {
    console.log('🔧 ユーザー権限修正を開始...')

    // 1. Authユーザーの確認
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Authユーザー一覧取得エラー:', authError.message)
      return
    }

    const authUser = authUsers.users.find(u => u.email === email)

    if (!authUser) {
      console.error('❌ ユーザーが見つかりません:', email)
      return
    }

    console.log('✅ Authユーザー確認:', authUser.email, authUser.id)

    // 2. usersテーブルの確認と修正
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = 見つからない
      console.error('❌ ユーザー確認エラー:', userError.message)
      return
    }

    if (existingUser) {
      console.log('📋 既存ユーザー情報:')
      console.log('   名前:', existingUser.name)
      console.log('   ロール:', existingUser.role)
      console.log('   メール:', existingUser.email)

      // ロールがadminでない場合は更新
      if (existingUser.role !== 'admin') {
        console.log('🔄 ロールをadminに更新...')
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', authUser.id)

        if (updateError) {
          console.error('❌ ロール更新エラー:', updateError.message)
        } else {
          console.log('✅ ロールをadminに更新しました')
        }
      } else {
        console.log('✅ 既にadminロールが設定されています')
      }
    } else {
      console.log('📝 新しいユーザーを作成...')
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          role: 'admin',
          created_at: new Date().toISOString(),
        }])

      if (insertError) {
        console.error('❌ ユーザー作成エラー:', insertError.message)
      } else {
        console.log('✅ 管理者ユーザーを作成しました')
      }
    }

    // 3. 最終確認
    console.log('\n🔍 最終確認:')
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (finalError) {
      console.error('❌ 最終確認エラー:', finalError.message)
    } else if (finalUser) {
      console.log('✅ ユーザー権限確認:')
      console.log('   名前:', finalUser.name)
      console.log('   メール:', finalUser.email)
      console.log('   ロール:', finalUser.role)
      console.log('   作成日:', finalUser.created_at)
    } else {
      console.log('❌ ユーザーが見つかりません')
    }

    console.log('\n🎉 権限修正完了！')
    console.log('\n📋 テスト手順:')
    console.log('1. http://localhost:3001/login にアクセス')
    console.log('2. メール: superadmin@example.com')
    console.log('3. パスワード: admin')
    console.log('4. 管理者ページにアクセス:')
    console.log('   - http://localhost:3001/users (管理者ページ)')
    console.log('   - http://localhost:3001/admin (管理者パネル)')
    console.log('   - http://localhost:3001/super-admin (スーパー管理者パネル)')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  fixUserPermissions()
}

module.exports = { fixUserPermissions }



