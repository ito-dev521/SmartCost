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

async function deleteItoUser() {
  const email = 'ito@ii-stylelab.com'

  try {
    console.log('🗑️ ito@ii-stylelab.com の削除を開始...')

    // 1. 削除前の確認
    console.log('\n📋 削除前の状態確認:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Authユーザー取得エラー:', authError.message)
      return
    }

    const itoUser = authUsers.users.find(u => u.email === email)
    if (!itoUser) {
      console.log('❌ ユーザーが見つかりません:', email)
      return
    }

    console.log('✅ 削除対象ユーザー:', itoUser.email, itoUser.id)

    // 2. super_adminsテーブルから削除
    console.log('\n🗑️ super_adminsテーブルから削除...')
    const { data: deletedSuperAdmin, error: deleteSuperError } = await supabase
      .from('super_admins')
      .delete()
      .eq('email', email)
      .select()

    if (deleteSuperError) {
      console.error('❌ super_adminsテーブル削除エラー:', deleteSuperError.message)
    } else {
      console.log('✅ super_adminsテーブルから削除成功:', deletedSuperAdmin)
    }

    // 3. Supabase Authから削除
    console.log('\n🗑️ Supabase Authから削除...')
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(itoUser.id)

    if (deleteAuthError) {
      console.error('❌ Authユーザー削除エラー:', deleteAuthError.message)
    } else {
      console.log('✅ Authユーザー削除成功')
    }

    // 4. 最終確認
    console.log('\n🔍 削除後の確認:')

    // Authユーザー確認
    const { data: finalAuthUsers, error: finalAuthError } = await supabase.auth.admin.listUsers()
    if (finalAuthError) {
      console.error('❌ 最終Auth確認エラー:', finalAuthError.message)
    } else {
      const remainingItoUser = finalAuthUsers.users.find(u => u.email === email)
      if (remainingItoUser) {
        console.log('❌ Authユーザー削除失敗:', remainingItoUser.email)
      } else {
        console.log('✅ Authユーザー削除確認済み')
      }
    }

    // super_adminsテーブル確認
    const { data: finalSuperAdmins, error: finalSuperError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)

    if (finalSuperError) {
      console.error('❌ 最終super_admins確認エラー:', finalSuperError.message)
    } else if (finalSuperAdmins && finalSuperAdmins.length > 0) {
      console.log('❌ super_adminsテーブル削除失敗:', finalSuperAdmins[0].email)
    } else {
      console.log('✅ super_adminsテーブル削除確認済み')
    }

    console.log('\n🎉 削除完了！')
    console.log('\n📋 残りのスーパー管理者:')
    const { data: remainingAdmins, error: remainingError } = await supabase
      .from('super_admins')
      .select('*')

    if (remainingError) {
      console.error('❌ 残り管理者確認エラー:', remainingError.message)
    } else {
      console.log(`   総数: ${remainingAdmins?.length || 0}人`)
      remainingAdmins?.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.name})`)
      })
    }

    console.log('\n📋 使用可能なログイン情報:')
    console.log('   メール: superadmin@example.com')
    console.log('   パスワード: admin')
    console.log('   super-adminページ: http://localhost:3000/super-admin')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  // 安全のため、確認メッセージを表示
  console.log('⚠️ 警告: この操作は取り消せません！')
  console.log('   削除対象: ito@ii-stylelab.com')
  console.log('   影響: Authユーザーとsuper_adminsレコードが完全に削除されます')
  console.log('')
  console.log('続行しますか？ (スクリプトを実行する場合はそのまま続行)')

  // 3秒待機
  setTimeout(() => {
    deleteItoUser()
  }, 3000)
}

module.exports = { deleteItoUser }





