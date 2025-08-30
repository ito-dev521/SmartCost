-- admin_settingsテーブルを完全に作り直す
-- 既存のテーブルを削除
DROP TABLE IF EXISTS admin_settings CASCADE;

-- 新しいadmin_settingsテーブルを作成
CREATE TABLE admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- RLSを無効化
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- デフォルト設定を挿入
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES ('work_management_type', 'hours', '工数管理タイプ: hours（工数管理）または time（時間管理）')
ON CONFLICT (setting_key) DO NOTHING;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- コメントの追加
COMMENT ON TABLE admin_settings IS '管理者設定テーブル（RLS無効化）';
COMMENT ON COLUMN admin_settings.id IS '設定ID';
COMMENT ON COLUMN admin_settings.setting_key IS '設定キー';
COMMENT ON COLUMN admin_settings.setting_value IS '設定値';
COMMENT ON COLUMN admin_settings.description IS '設定説明';
COMMENT ON COLUMN admin_settings.created_at IS '作成日時';
COMMENT ON COLUMN admin_settings.updated_at IS '更新日時';








