-- 緊急RLS修正スクリプト（安全版）
-- company_idカラムが確実に存在するテーブルのみ対象

-- 1. companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON companies;
DROP POLICY IF EXISTS "Enable update for users based on email" ON companies;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 2. usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 3. company_settingsテーブル
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON company_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON company_settings;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access their company settings" ON company_settings
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('companies', 'users', 'company_settings')
ORDER BY tablename;
