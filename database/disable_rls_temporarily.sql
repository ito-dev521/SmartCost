-- 一時的にRLSを無効化（テスト用）
-- 注意: 本番環境では使用しないでください

-- project_progressテーブルのRLSを無効化
ALTER TABLE project_progress DISABLE ROW LEVEL SECURITY;

-- user_permissionsテーブルのRLSを無効化
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;

-- 現在のRLS状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('project_progress', 'user_permissions');

