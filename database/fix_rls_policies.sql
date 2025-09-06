-- RLSポリシーの修正
-- 各テーブルでRLSを有効化し、適切なポリシーを設定

-- 1. companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON companies;

-- 新しいポリシーを作成
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 2. usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- 新しいポリシーを作成
CREATE POLICY "Users can view users in their company" ON users
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view projects in their company" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;

-- 新しいポリシーを作成
CREATE POLICY "Users can view projects in their company" ON projects
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;

-- 新しいポリシーを作成
CREATE POLICY "Users can view clients in their company" ON clients
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all clients" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. cost_entriesテーブル
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view cost entries in their company" ON cost_entries;
DROP POLICY IF EXISTS "Admins can view all cost entries" ON cost_entries;

-- 新しいポリシーを作成
CREATE POLICY "Users can view cost entries in their company" ON cost_entries
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all cost entries" ON cost_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 6. daily_reportsテーブル
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view daily reports in their company" ON daily_reports;
DROP POLICY IF EXISTS "Admins can view all daily reports" ON daily_reports;

-- 新しいポリシーを作成
CREATE POLICY "Users can view daily reports in their company" ON daily_reports
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all daily reports" ON daily_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 7. salary_entriesテーブル
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view salary entries in their company" ON salary_entries;
DROP POLICY IF EXISTS "Admins can view all salary entries" ON salary_entries;

-- 新しいポリシーを作成
CREATE POLICY "Users can view salary entries in their company" ON salary_entries
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all salary entries" ON salary_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 8. company_settingsテーブル
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;

-- 新しいポリシーを作成
CREATE POLICY "Users can view their company settings" ON company_settings
    FOR SELECT USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all company settings" ON company_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
