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

async function checkAdminSettings() {
  try {
    console.log('🔍 admin_settingsテーブルチェックを開始...')

    // 1. テーブルが存在するかを確認
    console.log('\n📋 admin_settingsテーブルの存在確認:')
    try {
      const { data: adminSettings, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(10)

      if (error) {
        console.error('❌ admin_settingsテーブルアクセスエラー:', error.message)
        console.error('   コード:', error.code)

        if (error.code === 'PGRST116') {
          console.log('📋 テーブルが存在しない可能性があります')
          console.log('🔄 Supabase Dashboardで以下のSQLを実行してください:')
          console.log('---')
          console.log(`
-- 管理者設定テーブルの作成
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- 更新時のタイムスタンプ更新トリガー
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_updated_at();

-- RLS（Row Level Security）の有効化
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Super admins can view all admin settings" ON admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can insert admin settings" ON admin_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can update admin settings" ON admin_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can delete admin settings" ON admin_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

-- デフォルト設定の挿入
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES ('work_management_type', 'hours', '工数管理タイプ: hours（工数管理）または time（時間管理）')
ON CONFLICT (setting_key) DO NOTHING;
          `)
          console.log('---')
        }
        return
      }

      console.log(`✅ admin_settingsテーブルアクセス成功`)
      console.log(`   レコード数: ${adminSettings?.length || 0}`)

      if (adminSettings && adminSettings.length > 0) {
        console.log('   レコード内容:')
        adminSettings.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.setting_key}: ${record.setting_value}`)
          console.log(`      説明: ${record.description}`)
          console.log(`      ID: ${record.id}`)
          console.log('')
        })
      } else {
        console.log('   ⚠️ レコードが存在しません')
        console.log('🔄 デフォルト設定を挿入してください:')
        console.log(`
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES ('work_management_type', 'hours', '工数管理タイプ: hours（工数管理）または time（時間管理）');
        `)
      }

    } catch (tableError) {
      console.error('❌ テーブルアクセス例外:', tableError.message)
    }

    // 2. 現在のユーザーでadmin_settingsにアクセスできるかをテスト
    console.log('\n🔍 現在のユーザーでのアクセステスト:')

    // セッション取得を試行
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('   現在のユーザー:', user ? `${user.email} (${user.id})` : 'なし')
    console.log('   ユーザー取得エラー:', userError ? userError.message : 'なし')

    if (user) {
      try {
        // 現在のユーザーでadmin_settingsにアクセス
        const { data: userSettings, error: userSettingsError } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', 'work_management_type')
          .single()

        if (userSettingsError) {
          console.error('❌ ユーザーでの設定取得エラー:', userSettingsError.message)
          console.error('   コード:', userSettingsError.code)

          if (userSettingsError.code === 'PGRST116') {
            console.log('   ⚠️ RLSポリシーによりアクセスが拒否されました')
            console.log('   🔍 ユーザーがsuper_adminsテーブルに存在するか確認してください')
          }
        } else {
          console.log('✅ ユーザーでの設定取得成功:', userSettings?.setting_value)
        }
      } catch (userAccessError) {
        console.error('❌ ユーザーアクセス例外:', userAccessError.message)
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  checkAdminSettings()
}

module.exports = { checkAdminSettings }
