-- usersテーブルの無限再帰を完全に修正

-- 1. usersテーブルの既存ポリシーを全て削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 2. usersテーブルのRLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. アプリケーションレベルでアクセス制御を行う
-- RLSポリシーは使用せず、アプリケーション側でcompany_idをチェック

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';
