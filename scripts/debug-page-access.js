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

async function debugPageAccess() {
  const email = 'superadmin@example.com'
  const password = 'admin'

  try {
    console.log('🔍 ページアクセス認証デバッグを開始...')
    console.log('   対象ユーザー:', email)

    // 0. 現在のデータベース状態確認
    console.log('\n📊 現在のデータベース状態:')
    const { data: currentSuperAdmins, error: currentError } = await supabase
      .from('super_admins')
      .select('*')

    if (currentError) {
      console.error('   ❌ データベース確認エラー:', currentError.message)
    } else {
      console.log(`   ✅ super_adminsレコード数: ${currentSuperAdmins?.length || 0}`)
      currentSuperAdmins?.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.email} (アクティブ: ${record.is_active})`)
      })
    }

    // 1. ログイン試行
    console.log('\n🔐 ログイン試行:')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (signInError) {
      console.error('❌ ログインエラー:', signInError.message)
      return
    }

    console.log('✅ ログイン成功:', signInData.user?.email)
    console.log('   セッション:', signInData.session ? '存在' : 'なし')
    console.log('   アクセストークン:', signInData.session?.access_token ? '存在' : 'なし')

    // 2. セッション確認
    console.log('\n📋 セッション詳細:')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError.message)
    } else {
      console.log('   セッション存在:', session ? 'はい' : 'いいえ')
      if (session) {
        console.log('   ユーザーID:', session.user.id)
        console.log('   メール:', session.user.email)
        console.log('   アクセストークン有効期限:', new Date(session.expires_at * 1000).toLocaleString())
        console.log('   リフレッシュトークン有効期限:', new Date(session.expires_in * 1000).toLocaleString())
      }
    }

    // 3. スーパー管理者権限確認
    console.log('\n👑 スーパー管理者権限確認:')
    console.log('   ステップ1: emailでの検索')
    const { data: superAdminRecords, error: superAdminSearchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)

    if (superAdminSearchError) {
      console.error('   ❌ email検索エラー:', superAdminSearchError.message)
    } else {
      console.log(`   ✅ email検索結果: ${superAdminRecords?.length || 0}件`)
      superAdminRecords?.forEach((record, index) => {
        console.log(`      ${index + 1}. ${record.email} - アクティブ: ${record.is_active}`)
      })
    }

    console.log('   ステップ2: is_active=trueでの検索')
    const { data: activeSuperAdminRecords, error: activeSuperAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)

    if (activeSuperAdminError) {
      console.error('   ❌ is_active検索エラー:', activeSuperAdminError.message)
    } else {
      console.log(`   ✅ is_active検索結果: ${activeSuperAdminRecords?.length || 0}件`)
    }

    console.log('   ステップ3: .single()での検索')
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (superAdminError) {
      console.error('❌ スーパー管理者取得エラー:', superAdminError.message)
      console.error('   エラーコード:', superAdminError.code)
    } else if (superAdmin) {
      console.log('✅ スーパー管理者権限あり:', superAdmin.name)
      console.log('   アクティブ:', superAdmin.is_active)
      console.log('   作成日:', superAdmin.created_at)
    } else {
      console.log('❌ スーパー管理者権限なし')
    }

    // 4. usersテーブル権限確認
    console.log('\n👤 usersテーブル権限確認:')
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError.message)
      console.error('   エラーコード:', userError.code)
    } else if (userRecord) {
      console.log('✅ ユーザー権限あり:', userRecord.name)
      console.log('   ロール:', userRecord.role)
      console.log('   作成日:', userRecord.created_at)
    } else {
      console.log('❌ ユーザー権限なし')
    }

    console.log('\n📋 デバッグ結果:')
    console.log('✅ 認証状態:', session ? '正常' : '問題あり')
    console.log('✅ スーパー管理者権限:', superAdmin ? '正常' : '問題あり')
    console.log('✅ ユーザー権限:', userRecord ? '正常' : '問題あり')

    if (session && superAdmin && userRecord) {
      console.log('\n🎉 すべての権限チェックが正常です')
      console.log('💡 ブラウザでページアクセスを試行してください')
      console.log('   http://localhost:3000/projects')
      console.log('   http://localhost:3000/clients')
      console.log('   http://localhost:3000/analytics')
      console.log('   http://localhost:3000/cost-entry')
      console.log('   http://localhost:3000/admin')
    } else {
      console.log('\n❌ 権限チェックで問題が見つかりました')
      console.log('💡 問題を修正してからページアクセスを試行してください')
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  debugPageAccess()
}

module.exports = { debugPageAccess }
