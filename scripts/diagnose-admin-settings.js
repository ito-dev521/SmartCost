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

async function diagnoseAdminSettings() {
  try {
    console.log('🔍 管理者設定診断を開始...')

    // 1. super_adminsテーブルの確認
    console.log('\n📋 super_adminsテーブルの確認:')
    try {
      const { data: superAdmins, error } = await supabase
        .from('super_admins')
        .select('*')

      if (error) {
        console.error('❌ super_adminsアクセスエラー:', error.message)
        console.error('   コード:', error.code)
        console.error('   詳細:', error.details)
        return
      }

      console.log(`✅ super_adminsレコード数: ${superAdmins?.length || 0}`)
      if (superAdmins && superAdmins.length > 0) {
        superAdmins.forEach((admin, index) => {
          console.log(`   ${index + 1}. ${admin.email} (ID: ${admin.id})`)
          console.log(`      名前: ${admin.name}`)
          console.log(`      アクティブ: ${admin.is_active}`)
          console.log(`      作成日: ${admin.created_at}`)
          console.log('')
        })
      } else {
        console.log('   ⚠️ super_adminsテーブルにデータがありません')
        console.log('   🔄 スーパー管理者を追加する必要があります')
        console.log('   SQL例:')
        console.log(`
INSERT INTO super_admins (email, name, is_active)
VALUES ('superadmin@example.com', 'スーパー管理者', true);
        `)
      }
    } catch (error) {
      console.error('❌ super_admins例外:', error.message)
    }

    // 2. admin_settingsテーブルの確認
    console.log('\n📋 admin_settingsテーブルの確認:')
    try {
      const { data: adminSettings, error } = await supabase
        .from('admin_settings')
        .select('*')

      if (error) {
        console.error('❌ admin_settingsアクセスエラー:', error.message)
        console.error('   コード:', error.code)
        return
      }

      console.log(`✅ admin_settingsレコード数: ${adminSettings?.length || 0}`)
      if (adminSettings && adminSettings.length > 0) {
        adminSettings.forEach((setting, index) => {
          console.log(`   ${index + 1}. ${setting.setting_key}: ${setting.setting_value}`)
          console.log(`      説明: ${setting.description}`)
          console.log(`      ID: ${setting.id}`)
          console.log('')
        })
      } else {
        console.log('   ⚠️ admin_settingsテーブルにデータがありません')
        console.log('   🔄 デフォルト設定を追加する必要があります')
        console.log(`
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES ('work_management_type', 'hours', '工数管理タイプ: hours（工数管理）または time（時間管理）');
        `)
      }
    } catch (error) {
      console.error('❌ admin_settings例外:', error.message)
    }

    // 3. RLSポリシーの確認
    console.log('\n📋 RLSポリシーの確認:')
    try {
      // admin_settingsテーブルのポリシーを確認
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', 'admin_settings')

      if (error) {
        console.error('❌ ポリシー確認エラー:', error.message)
      } else {
        console.log(`✅ ポリシー数: ${policies?.length || 0}`)
        if (policies && policies.length > 0) {
          policies.forEach((policy, index) => {
            console.log(`   ${index + 1}. ${policy.policyname}`)
            console.log(`      コマンド: ${policy.cmd}`)
            console.log(`      ロール: ${policy.roles}`)
            console.log('')
          })
        } else {
          console.log('   ⚠️ admin_settingsテーブルにポリシーが設定されていません')
        }
      }
    } catch (error) {
      console.error('❌ ポリシー確認例外:', error.message)
    }

    // 4. テストユーザーでのアクセス確認
    console.log('\n📋 テストユーザーでのアクセス確認:')
    console.log('   ※ 実際のブラウザセッションでは異なる結果になる可能性があります')

    // 現在のセッションを確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('   現在のセッション:', session ? 'あり' : 'なし')
    if (sessionError) {
      console.error('   セッションエラー:', sessionError.message)
    }

  } catch (error) {
    console.error('❌ 診断エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  diagnoseAdminSettings()
}

module.exports = { diagnoseAdminSettings }

