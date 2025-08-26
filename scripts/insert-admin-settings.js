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

async function insertAdminSettings() {
  try {
    console.log('🔧 admin_settingsテーブルに初期データを挿入開始...')

    // 1. 現在のデータを確認
    console.log('\n📋 現在のadmin_settings状態:')
    const { data: currentSettings, error: currentError } = await supabase
      .from('admin_settings')
      .select('*')

    if (currentError) {
      console.error('❌ 現在の設定取得エラー:', currentError)
    } else {
      console.log('✅ 現在の設定:', currentSettings)
      if (currentSettings && currentSettings.length > 0) {
        currentSettings.forEach((setting, index) => {
          console.log(`   ${index + 1}. ${setting.setting_key} = ${setting.setting_value}`)
        })
      } else {
        console.log('   データなし')
      }
    }

    // 2. 既存データを削除
    console.log('\n🗑️  既存データの削除:')
    const { error: deleteError } = await supabase
      .from('admin_settings')
      .delete()
      .eq('setting_key', 'work_management_type')

    if (deleteError) {
      console.error('❌ 削除エラー:', deleteError)
    } else {
      console.log('✅ 既存データを削除しました')
    }

    // 3. 新しいデータを挿入
    console.log('\n➕ 新しいデータの挿入:')
    const newSetting = {
      setting_key: 'work_management_type',
      setting_value: 'hours',
      description: '工数管理タイプ: hours（工数管理）または time（時間管理）'
    }

    const { data: insertResult, error: insertError } = await supabase
      .from('admin_settings')
      .insert([newSetting])
      .select()

    if (insertError) {
      console.error('❌ 挿入エラー:', insertError)
      return
    }

    console.log('✅ データ挿入成功:', insertResult)

    // 4. 挿入結果を確認
    console.log('\n📋 挿入後の確認:')
    const { data: afterInsert, error: afterError } = await supabase
      .from('admin_settings')
      .select('*')

    if (afterError) {
      console.error('❌ 確認エラー:', afterError)
    } else {
      console.log('✅ 挿入後の設定:', afterInsert)
      if (afterInsert && afterInsert.length > 0) {
        afterInsert.forEach((setting, index) => {
          console.log(`   ${index + 1}. ${setting.setting_key} = ${setting.setting_value}`)
        })
      }
    }

    console.log('\n🎉 admin_settingsテーブルの初期化が完了しました！')

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  insertAdminSettings()
}

module.exports = { insertAdminSettings }
