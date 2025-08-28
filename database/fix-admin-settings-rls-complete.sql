-- admin_settingsテーブルのRLSを完全に無効化
-- 既存のすべてのポリシーを削除
DROP POLICY IF EXISTS "Super admins can manage admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Everyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Anyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can insert admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can delete admin settings" ON admin_settings;

-- RLSを完全に無効化
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- 現在の設定を確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'admin_settings' AND schemaname = 'public';

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admin_settings';

-- 現在のデータを確認
SELECT * FROM admin_settings;

-- コメント更新
COMMENT ON TABLE admin_settings IS '管理者設定テーブル（RLS完全無効化）';




