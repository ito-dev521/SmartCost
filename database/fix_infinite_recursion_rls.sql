-- RLS無限再帰問題の修正
-- 問題: usersテーブルのRLSポリシーが自己参照して無限再帰を起こしている

-- 1. 問題のあるRLSポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 2. 安全なRLSポリシーを作成
-- アプローチ: auth.uid()を直接使用し、自己参照を避ける

-- 自分自身のレコードは常にアクセス可能
CREATE POLICY "Users can access their own record" ON users
    FOR ALL USING (id = auth.uid());

-- 同じ会社の管理者は他のユーザーも閲覧可能（ただし、自分の会社IDを事前に設定）
-- この場合はauth.jwt()のメタデータまたは別のアプローチを使用

-- 3. 一時的な解決策: 認証済みユーザーは全ユーザーを閲覧可能（後で制限を追加）
CREATE POLICY "Authenticated users can read all users temporarily" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. 自分のレコードのみ更新可能
CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (id = auth.uid());

-- 5. 管理者のみ新規ユーザー作成可能（role情報はusersテーブル外で管理する必要）
-- 一時的に認証済みユーザーが作成可能
CREATE POLICY "Authenticated users can insert users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- ポリシー確認
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

