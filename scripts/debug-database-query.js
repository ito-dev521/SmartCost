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

async function debugDatabaseQuery() {
  const email = 'superadmin@example.com'

  try {
    console.log('🔍 データベースクエリデバッグを開始...')

    // 1. super_adminsテーブルの全レコード確認
    console.log('\n📋 super_adminsテーブル全レコード:')
    const { data: allSuperAdmins, error: allError } = await supabase
      .from('super_admins')
      .select('*')

    if (allError) {
      console.error('❌ 全レコード取得エラー:', allError.message)
    } else {
      console.log(`   レコード数: ${allSuperAdmins?.length || 0}`)
      allSuperAdmins?.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.email} (ID: ${record.id})`)
        console.log(`      名前: ${record.name}`)
        console.log(`      アクティブ: ${record.is_active}`)
        console.log(`      作成日: ${record.created_at}`)
        console.log('')
      })
    }

    // 2. usersテーブルの全レコード確認
    console.log('\n📋 usersテーブル全レコード:')
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      console.error('❌ ユーザー全レコード取得エラー:', usersError.message)
    } else {
      console.log(`   レコード数: ${allUsers?.length || 0}`)
      allUsers?.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.email} (ID: ${record.id})`)
        console.log(`      名前: ${record.name}`)
        console.log(`      ロール: ${record.role}`)
        console.log(`      作成日: ${record.created_at}`)
        console.log('')
      })
    }

    // 3. 特定のemailでの検索（.single()なし）
    console.log(`\n🔍 email='${email}'での検索:`)

    // super_admins検索
    console.log('   super_adminsテーブル:')
    const { data: superAdminRecords, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)

    if (superAdminError) {
      console.error('   ❌ 検索エラー:', superAdminError.message)
    } else {
      console.log(`   ✅ 検索結果: ${superAdminRecords?.length || 0}件`)
      superAdminRecords?.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.email} (${record.name})`)
      })
    }

    // users検索
    console.log('   usersテーブル:')
    const { data: userRecords, error: userSearchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (userSearchError) {
      console.error('   ❌ 検索エラー:', userSearchError.message)
    } else {
      console.log(`   ✅ 検索結果: ${userRecords?.length || 0}件`)
      userRecords?.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.email} (${record.name}) - ロール: ${record.role}`)
      })
    }

    // 4. .single()での検索（現在の問題を再現）
    console.log('\n🔍 .single()での検索テスト:')

    console.log('   super_adminsテーブル (.single()):')
    try {
      const { data: singleSuperAdmin, error: singleSuperError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .single()

      if (singleSuperError) {
        console.error('   ❌ エラー:', singleSuperError.message)
        console.error('   エラーコード:', singleSuperError.code)
      } else {
        console.log('   ✅ 成功:', singleSuperAdmin.email)
      }
    } catch (error) {
      console.error('   ❌ 例外:', error.message)
    }

    console.log('   usersテーブル (.single()):')
    try {
      const { data: singleUser, error: singleUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (singleUserError) {
        console.error('   ❌ エラー:', singleUserError.message)
        console.error('   エラーコード:', singleUserError.code)
      } else {
        console.log('   ✅ 成功:', singleUser.email)
      }
    } catch (error) {
      console.error('   ❌ 例外:', error.message)
    }

    console.log('\n📋 診断結果:')
    console.log('✅ データベース接続: 正常')
    console.log('✅ レコード存在確認: 完了')
    console.log('🔍 .single()メソッドの問題特定: 進行中')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  debugDatabaseQuery()
}

module.exports = { debugDatabaseQuery }
