#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testRLSFix() {
  try {
    console.log('🔍 RLS修正後のテストを開始...')

    // 1. テーブルのRLS状態を確認
    console.log('\n📋 テーブルのRLS状態確認:')
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
          'users', 'companies', 'clients', 'projects', 
          'departments', 'company_settings', 'fiscal_info', 'company_admins'
        )
        ORDER BY tablename
      `
    })

    if (tableError) {
      console.log('❌ テーブル情報取得エラー:', tableError.message)
    } else {
      console.log('   テーブルRLS状態:')
      tables?.forEach(table => {
        const status = table.rowsecurity ? '🔒 有効' : '🔓 無効'
        console.log(`   ${table.tablename}: ${status}`)
      })
    }

    // 2. 現在のポリシーを確認
    console.log('\n📋 現在のRLSポリシー:')
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename, 
          policyname, 
          cmd,
          permissive
        FROM pg_policies 
        WHERE tablename IN (
          'users', 'companies', 'clients', 'projects',
          'departments', 'company_settings', 'fiscal_info', 'company_admins'
        )
        ORDER BY tablename, policyname
      `
    })

    if (policyError) {
      console.log('❌ ポリシー情報取得エラー:', policyError.message)
    } else {
      console.log('   アクティブなポリシー:')
      policies?.forEach(policy => {
        console.log(`   ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
      })
    }

    // 3. usersテーブルへのアクセステスト（無限再帰チェック）
    console.log('\n🧪 usersテーブルアクセステスト:')
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .limit(5)

      if (usersError) {
        if (usersError.message.includes('infinite recursion')) {
          console.log('❌ まだ無限再帰エラーが発生しています:', usersError.message)
          console.log('   緊急修正スクリプトを実行してください')
        } else {
          console.log('❌ 別のエラーが発生:', usersError.message)
        }
      } else {
        console.log('✅ usersテーブルアクセス成功')
        console.log(`   取得したユーザー数: ${users?.length || 0}`)
      }
    } catch (error) {
      console.error('❌ usersテーブルアクセス例外:', error.message)
    }

    // 4. 他のテーブルへのアクセステスト
    const testTables = ['companies', 'clients', 'projects']
    for (const tableName of testTables) {
      console.log(`\n🧪 ${tableName}テーブルアクセステスト:`)
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)

        if (error) {
          console.log(`❌ ${tableName}テーブルエラー:`, error.message)
        } else {
          console.log(`✅ ${tableName}テーブルアクセス成功`)
          console.log(`   取得したレコード数: ${data?.length || 0}`)
        }
      } catch (error) {
        console.error(`❌ ${tableName}テーブル例外:`, error.message)
      }
    }

    console.log('\n🎯 テスト完了')
    console.log('   無限再帰エラーが解決されていれば、コンソールエラーが停止するはずです')

  } catch (error) {
    console.error('❌ テストエラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  testRLSFix()
}

module.exports = { testRLSFix }

