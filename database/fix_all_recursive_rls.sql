-- すべてのRLS無限再帰問題の修正
-- 問題: 複数のテーブルでusersテーブルを参照するRLSポリシーが無限再帰を起こしている

-- ===== 1. usersテーブルの修正 =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 新しい安全なポリシーを作成
CREATE POLICY "users_select_own_and_company" ON users
    FOR SELECT USING (
        -- 自分のレコードは常に閲覧可能
        id = auth.uid() 
        OR 
        -- 同じ会社のユーザーも閲覧可能（メタデータを使用）
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== 2. companiesテーブルの修正 =====
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;

-- 新しいポリシー（メタデータ使用）
CREATE POLICY "companies_access_own" ON companies
    FOR ALL USING (
        id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 3. clientsテーブルの修正 =====
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;

-- 新しいポリシー
CREATE POLICY "clients_access_company" ON clients
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 4. projectsテーブルの修正 =====
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
DROP POLICY IF EXISTS "Users can view projects in their company" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;

-- 新しいポリシー
CREATE POLICY "projects_access_company" ON projects
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 5. departmentsテーブルの修正 =====
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can view departments in their company" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;

-- 新しいポリシー
CREATE POLICY "departments_access_company" ON departments
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 6. company_settingsテーブルの修正 =====
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can view their company settings" ON company_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_settings;

-- 新しいポリシー
CREATE POLICY "company_settings_access_own" ON company_settings
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 7. fiscal_infoテーブルの修正 =====
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Users can view fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Enable read access for all users" ON fiscal_info;

-- 新しいポリシー
CREATE POLICY "fiscal_info_access_company" ON fiscal_info
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 8. company_adminsテーブルの修正 =====
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;
DROP POLICY IF EXISTS "Users can view company admins in their company" ON company_admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_admins;

-- 新しいポリシー
CREATE POLICY "company_admins_access_company" ON company_admins
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 確認用クエリ =====
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'companies', 'clients', 'projects', 'departments',
    'company_settings', 'fiscal_info', 'company_admins'
)
ORDER BY tablename;

-- ポリシー確認
SELECT 
    tablename, 
    policyname, 
    cmd, 
    permissive,
    substr(qual, 1, 100) as qual_truncated
FROM pg_policies 
WHERE tablename IN (
    'users', 'companies', 'clients', 'projects', 'departments',
    'company_settings', 'fiscal_info', 'company_admins'
)
ORDER BY tablename, policyname;

