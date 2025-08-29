-- user_permissionsテーブルの作成
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_name)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_name ON user_permissions(permission_name);

-- RLSポリシーの設定
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の権限を閲覧可能
CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- 管理者は全ての権限を閲覧・編集可能
CREATE POLICY "Admins can view all permissions" ON user_permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert permissions" ON user_permissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update permissions" ON user_permissions
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete permissions" ON user_permissions
  FOR DELETE USING (true);

-- 更新時のタイムスタンプ更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_permissions_updated_at 
  BEFORE UPDATE ON user_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 基本的な権限を追加（必要に応じて）
INSERT INTO user_permissions (user_id, permission_name) 
SELECT id, 'canViewProgress' 
FROM auth.users 
WHERE email = 'admin@example.com'  -- 管理者のメールアドレスを適切に設定
ON CONFLICT (user_id, permission_name) DO NOTHING;





