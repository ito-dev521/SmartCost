-- デバッグ用：一時的にRLSを無効化
-- 注意：本番環境では使用しないでください

-- 給与入力に必要なテーブルのRLSを一時的に無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 完了メッセージ
SELECT 'RLSが一時的に無効化されました（デバッグ用）' as message;



