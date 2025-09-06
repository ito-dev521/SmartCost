-- 緊急RLS修正スクリプト
-- 全てのテーブルでRLSを有効化し、会社単位のアクセス制御を設定

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

-- 3. projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view projects in their company" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON projects;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 4. clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 5. cost_entriesテーブル
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view cost entries in their company" ON cost_entries;
DROP POLICY IF EXISTS "Admins can view all cost entries" ON cost_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON cost_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON cost_entries;
DROP POLICY IF EXISTS "Enable update for users based on email" ON cost_entries;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access cost entries in their company" ON cost_entries
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 6. daily_reportsテーブル
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view daily reports in their company" ON daily_reports;
DROP POLICY IF EXISTS "Admins can view all daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Enable read access for all users" ON daily_reports;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON daily_reports;
DROP POLICY IF EXISTS "Enable update for users based on email" ON daily_reports;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access daily reports in their company" ON daily_reports
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 7. salary_entriesテーブル
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view salary entries in their company" ON salary_entries;
DROP POLICY IF EXISTS "Admins can view all salary entries" ON salary_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON salary_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON salary_entries;
DROP POLICY IF EXISTS "Enable update for users based on email" ON salary_entries;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access salary entries in their company" ON salary_entries
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 8. company_settingsテーブル
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

-- 9. user_permissionsテーブル
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_permissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_permissions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_permissions;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access their own permissions" ON user_permissions
    FOR ALL USING (
        user_id = auth.uid()
    );

-- 10. departmentsテーブル
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view departments in their company" ON departments;
DROP POLICY IF EXISTS "Admins can view all departments" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON departments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON departments;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access departments in their company" ON departments
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
ORDER BY tablename;
