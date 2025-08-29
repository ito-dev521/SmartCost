-- admin_settingsテーブルのRLSを有効化し、適切なポリシーを設定
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Everyone can read admin settings" ON admin_settings
    FOR SELECT USING (true);

-- 管理者のみが管理可能（usersテーブルでroleがadmin以上のユーザーのみ）
CREATE POLICY "Admins can manage admin settings" ON admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- コメントの追加
COMMENT ON TABLE admin_settings IS '管理者設定テーブル（適切なRLS設定済み）';
COMMENT ON POLICY "Everyone can read admin settings" ON admin_settings IS '全員が管理者設定を参照できる';
COMMENT ON POLICY "Admins can manage admin settings" ON admin_settings IS '管理者権限を持つユーザーのみが管理者設定を管理できる';






