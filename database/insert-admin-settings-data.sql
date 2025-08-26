-- admin_settingsテーブルに初期データを挿入
-- このスクリプトはSupabase Dashboardで実行してください

-- 既存データを確認
SELECT * FROM admin_settings;

-- 既存データを削除（クリーンアップ）
DELETE FROM admin_settings WHERE setting_key = 'work_management_type';

-- 新しいデータを挿入
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'work_management_type',
  'hours',
  '工数管理タイプ: hours（工数管理）または time（時間管理）'
);

-- 挿入結果を確認
SELECT * FROM admin_settings;

-- テーブル構造の確認（標準SQL）
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
