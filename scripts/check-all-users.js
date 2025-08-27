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

async function checkAllUsers() {
  try {
    console.log('🔍 全ユーザー確認を開始...')

    // 1. Supabase Authの全ユーザーを確認
    console.log('\n📧 Supabase Auth ユーザー一覧:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Authユーザー取得エラー:', authError.message)
    } else {
      console.log(`   総ユーザー数: ${authUsers.users.length}`)
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`)
        console.log(`      作成日: ${user.created_at}`)
        console.log(`      メール確認: ${user.email_confirmed_at ? 'はい' : 'いいえ'}`)
      })
    }

    // 2. usersテーブルの確認
    console.log('\n👤 usersテーブル ユーザー一覧:')
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ usersテーブル取得エラー:', dbError.message)
    } else {
      console.log(`   総レコード数: ${dbUsers?.length || 0}`)
      dbUsers?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name})`)
        console.log(`      ロール: ${user.role}`)
        console.log(`      作成日: ${user.created_at}`)
      })
    }

    // 3. super_adminsテーブルの確認
    console.log('\n👑 super_adminsテーブル:')
    const { data: superAdmins, error: superError } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (superError) {
      console.error('❌ super_adminsテーブル取得エラー:', superError.message)
    } else {
      console.log(`   総レコード数: ${superAdmins?.length || 0}`)
      superAdmins?.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.name})`)
        console.log(`      アクティブ: ${admin.is_active}`)
        console.log(`      作成日: ${admin.created_at}`)
      })
    }

    // 4. ito@ii-stylelab.com の詳細確認
    console.log('\n🔍 ito@ii-stylelab.com の詳細:')
    const itoEmail = 'ito@ii-stylelab.com'

    // Authユーザー確認
    const itoAuthUser = authUsers?.users.find(u => u.email === itoEmail)
    if (itoAuthUser) {
      console.log('✅ Authユーザー存在:', itoAuthUser.email)
      console.log('   ユーザーID:', itoAuthUser.id)
      console.log('   作成日:', itoAuthUser.created_at)
      console.log('   メール確認:', itoAuthUser.email_confirmed_at ? 'はい' : 'いいえ')
    } else {
      console.log('❌ Authユーザーなし')
    }

    // usersテーブル確認
    const itoDbUser = dbUsers?.find(u => u.email === itoEmail)
    if (itoDbUser) {
      console.log('✅ usersテーブル存在:', itoDbUser.email)
      console.log('   名前:', itoDbUser.name)
      console.log('   ロール:', itoDbUser.role)
      console.log('   作成日:', itoDbUser.created_at)
    } else {
      console.log('❌ usersテーブルなし')
    }

    // super_adminsテーブル確認
    const itoSuperAdmin = superAdmins?.find(u => u.email === itoEmail)
    if (itoSuperAdmin) {
      console.log('✅ super_adminsテーブル存在:', itoSuperAdmin.email)
      console.log('   名前:', itoSuperAdmin.name)
      console.log('   アクティブ:', itoSuperAdmin.is_active)
      console.log('   作成日:', itoSuperAdmin.created_at)
    } else {
      console.log('❌ super_adminsテーブルなし')
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  checkAllUsers()
}

module.exports = { checkAllUsers }









