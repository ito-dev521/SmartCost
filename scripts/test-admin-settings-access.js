#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください')
  process.exit(1)
}

// ブラウザと同じクライアント（anon key使用）
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminSettingsAccess() {
  try {
    console.log('🔍 ブラウザと同じ条件でadmin_settingsアクセステスト開始...')
    console.log('   使用キー:', supabaseAnonKey ? 'anon key' : 'none')

    // 1. 匿名ユーザーとしてアクセス
    console.log('\n📋 匿名ユーザーとしてアクセス:')
    const { data: anonData, error: anonError } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('setting_key', 'work_management_type')

    if (anonError) {
      console.error('❌ 匿名アクセスエラー:', anonError)
      console.error('   コード:', anonError.code)
      console.error('   メッセージ:', anonError.message)
    } else {
      console.log('✅ 匿名アクセス成功:', anonData)
      if (anonData && anonData.length > 0) {
        anonData.forEach((setting, index) => {
          console.log(`   ${index + 1}. ${setting.setting_key} = ${setting.setting_value}`)
        })
      } else {
        console.log('   データなし')
      }
    }

    // 2. 認証済みユーザーとしてアクセス（テスト用）
    console.log('\n📋 認証済みユーザーとしてアクセス:')
    try {
      // ログイン試行（テスト用のユーザー）
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'superadmin@example.com',
        password: 'test123' // 実際のパスワードに変更してください
      })

      if (authError) {
        console.log('⚠️  ログイン失敗（想定内）:', authError.message)
        console.log('   匿名アクセスのみテストします')
      } else {
        console.log('✅ ログイン成功:', authData.user?.email)
        
        // 認証済みユーザーとして設定を取得
        const { data: authSettings, error: authSettingsError } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', 'work_management_type')

        if (authSettingsError) {
          console.error('❌ 認証済みアクセスエラー:', authSettingsError)
        } else {
          console.log('✅ 認証済みアクセス成功:', authSettings)
        }
      }
    } catch (loginError) {
      console.log('⚠️  ログイン処理エラー（想定内）:', loginError.message)
    }

    // 3. テーブル情報の確認
    console.log('\n📋 テーブル情報確認:')
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_name', 'admin_settings')
        .eq('table_schema', 'public')

      if (tableError) {
        console.error('❌ テーブル情報取得エラー:', tableError)
      } else {
        console.log('✅ テーブル情報:', tableInfo)
      }
    } catch (tableCheckError) {
      console.log('⚠️  テーブル情報確認エラー:', tableCheckError.message)
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  testAdminSettingsAccess()
}

module.exports = { testAdminSettingsAccess }





