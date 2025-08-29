-- admin_settingsテーブルのRLSポリシーを修正
-- 現在のポリシーを削除
DROP POLICY IF EXISTS "Super admins can view all admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can insert admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can update admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can delete admin settings" ON admin_settings;

-- 新しいポリシーを作成（よりシンプルで信頼性のあるもの）
-- スーパー管理者権限を持つユーザーのみにアクセスを許可
CREATE POLICY "Super admins can manage admin settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = (auth.jwt() ->> 'email')
            AND is_active = true
        )
    );

-- すべてのユーザーが参照できるようにする（読み取り専用）
-- これは管理者設定の参照を容易にするためのポリシー
CREATE POLICY "Anyone can read admin settings" ON admin_settings
    FOR SELECT USING (true);

-- コメントの追加
COMMENT ON POLICY "Super admins can manage admin settings" ON admin_settings IS 'スーパー管理者のみが管理者設定を管理できる';
COMMENT ON POLICY "Anyone can read admin settings" ON admin_settings IS 'すべてのユーザーが管理者設定を参照できる（読み取り専用）';






