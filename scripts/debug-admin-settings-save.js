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

async function debugAdminSettingsSave() {
  try {
    console.log('🔍 admin_settings保存デバッグを開始...')

    // 1. 現在のテーブル状態を確認
    console.log('\n📋 現在のadmin_settings状態:')
    const { data: currentSettings, error: currentError } = await supabase
      .from('admin_settings')
      .select('*')

    if (currentError) {
      console.error('❌ 現在の設定取得エラー:', currentError)
    } else {
      console.log('✅ 現在の設定:', currentSettings)
      if (currentSettings && currentSettings.length > 0) {
        const setting = currentSettings[0]
        console.log('   ID:', setting.id)
        console.log('   Key:', setting.setting_key)
        console.log('   Value:', setting.setting_value)
        console.log('   Description:', setting.description)
        console.log('   Created:', setting.created_at)
        console.log('   Updated:', setting.updated_at)
      }
    }

    // 2. RLS状態を確認
    console.log('\n📋 RLS状態確認:')
    try {
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename, rowsecurity')
        .eq('tablename', 'admin_settings')
        .eq('schemaname', 'public')

      if (rlsError) {
        console.error('❌ RLS状態確認エラー:', rlsError)
      } else {
        console.log('✅ RLS状態:', rlsStatus)
        if (rlsStatus && rlsStatus.length > 0) {
          console.log('   Row Security:', rlsStatus[0].rowsecurity ? '有効' : '無効')
        }
      }
    } catch (rlsCheckError) {
      console.error('❌ RLS状態確認例外:', rlsCheckError.message)
    }

    // 3. ポリシー状態を確認
    console.log('\n📋 ポリシー状態確認:')
    try {
      // 直接SQL実行でポリシーを確認
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'admin_settings')

      if (policyError) {
        console.log('⚠️  ポリシー確認エラー（RLSが無効化されている可能性）:', policyError.message)
      } else {
        console.log('✅ ポリシー数:', policies?.length || 0)
        if (policies && policies.length > 0) {
          policies.forEach((policy, index) => {
            console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`)
          })
        } else {
          console.log('   ポリシーはありません（RLS無効化済み）')
        }
      }
    } catch (policyCheckError) {
      console.error('❌ ポリシー確認例外:', policyCheckError.message)
    }

    // 4. 保存テストを実行
    console.log('\n🔧 保存テスト実行:')
    if (currentSettings && currentSettings.length > 0) {
      const setting = currentSettings[0]
      const newValue = setting.setting_value === 'hours' ? 'time' : 'hours'

      console.log(`   現在の値: ${setting.setting_value}`)
      console.log(`   新しい値: ${newValue}`)
      console.log(`   対象ID: ${setting.id}`)

      const { data: updateResult, error: updateError } = await supabase
        .from('admin_settings')
        .update({
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id)

      if (updateError) {
        console.error('❌ 保存テスト失敗:', updateError)
        console.error('   コード:', updateError.code)
        console.error('   メッセージ:', updateError.message)
      } else {
        console.log('✅ 保存テスト成功:', updateResult)

        // 更新後の確認
        const { data: afterUpdate, error: afterError } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('id', setting.id)

        if (afterError) {
          console.error('❌ 更新後確認エラー:', afterError)
        } else {
          console.log('✅ 更新後データ:', afterUpdate)
        }
      }
    } else {
      console.log('   ⚠️ 保存テストスキップ（データなし）')
    }

    // 5. 権限テスト
    console.log('\n📋 権限テスト:')
    try {
      // テーブルへのアクセス権限を確認
      const { data: grants, error: grantError } = await supabase
        .from('information_schema.role_table_grants')
        .select('grantee, privilege_type')
        .eq('table_name', 'admin_settings')

      if (grantError) {
        console.error('❌ 権限確認エラー:', grantError)
      } else {
        console.log('✅ 権限情報:', grants)
      }
    } catch (grantCheckError) {
      console.error('❌ 権限確認例外:', grantCheckError.message)
    }

  } catch (error) {
    console.error('❌ デバッグエラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  debugAdminSettingsSave()
}

module.exports = { debugAdminSettingsSave }






