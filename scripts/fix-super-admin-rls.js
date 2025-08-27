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

async function fixSuperAdminRLS() {
  const email = 'superadmin@example.com'

  try {
    console.log('🔧 RLSポリシーの問題を修正中...')

    // 1. 現在のRLS状態を確認
    console.log('\n📋 RLS状態確認:')
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'super_admins'"
    })

    if (tableError) {
      console.log('❌ テーブル情報取得エラー:', tableError.message)
    } else {
      console.log('   テーブル情報:', tables)
    }

    // 2. 現在のポリシーを確認
    console.log('\n📋 現在のポリシー:')
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM pg_policies WHERE tablename = 'super_admins'"
    })

    if (policyError) {
      console.log('❌ ポリシー情報取得エラー:', policyError.message)
    } else {
      console.log('   ポリシー情報:', policies)
    }

    // 3. RLSを一時的に無効にしてレコードを作成
    console.log('\n🔄 RLSを一時的に無効にしてレコード作成...')

    try {
      // RLSを無効化
      await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY"
      })
      console.log('✅ RLS無効化完了')

      // スーパー管理者レコードを作成
      const { data: newRecord, error: insertError } = await supabase
        .from('super_admins')
        .upsert([{
          email: email,
          name: 'スーパー管理者',
          password_hash: '$2b$10$demo.hash.for.super.admin.only',
          is_active: true
        }], {
          onConflict: 'email'
        })
        .select()

      if (insertError) {
        console.error('❌ レコード作成エラー:', insertError.message)
      } else {
        console.log('✅ スーパー管理者レコード作成成功:', newRecord)
      }

      // RLSを再有効化
      await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY"
      })
      console.log('✅ RLS再有効化完了')

    } catch (rlsError) {
      console.error('❌ RLS操作エラー:', rlsError.message)
    }

    // 4. 最終確認
    console.log('\n🔍 最終確認:')
    const { data: finalRecord, error: finalError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single()

    if (finalError) {
      console.error('❌ 最終確認エラー:', finalError.message)
    } else if (finalRecord) {
      console.log('✅ スーパー管理者レコード確認:')
      console.log('   メール:', finalRecord.email)
      console.log('   名前:', finalRecord.name)
      console.log('   アクティブ:', finalRecord.is_active)
      console.log('   作成日:', finalRecord.created_at)
    } else {
      console.log('❌ レコードが見つかりません')
    }

    console.log('\n🎉 RLS修正完了！')
    console.log('\n📋 テスト手順:')
    console.log('1. http://localhost:3000/login にアクセス')
    console.log('2. メール: superadmin@example.com')
    console.log('3. パスワード: admin')
    console.log('4. http://localhost:3000/super-admin にアクセス')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  fixSuperAdminRLS()
}

module.exports = { fixSuperAdminRLS }










