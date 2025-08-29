-- admin_settingsテーブルのRLSを完全に無効化（デバッグ用）
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Everyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can manage admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Anyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can insert admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can delete admin settings" ON admin_settings;

-- コメントの追加
COMMENT ON TABLE admin_settings IS '管理者設定テーブル（RLS無効化中 - デバッグ用）';






