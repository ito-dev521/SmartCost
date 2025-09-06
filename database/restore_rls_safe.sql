-- 適切なRLSポリシーを再設定（安全版）

-- 1. companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 2. usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 3. clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 4. projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 5. departmentsテーブル
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;
CREATE POLICY "Users can only access departments in their company" ON departments
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 6. company_settingsテーブル
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;
CREATE POLICY "Users can only access their company settings" ON company_settings
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 7. fiscal_infoテーブル
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;
CREATE POLICY "Users can only access fiscal info in their company" ON fiscal_info
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 8. company_adminsテーブル
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;
CREATE POLICY "Users can only access company admins in their company" ON company_admins
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 9. user_permissionsテーブル
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access user permissions in their company" ON user_permissions;
CREATE POLICY "Users can only access user permissions in their company" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = user_id
            AND u.company_id = public.get_user_company_id()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'companies',
    'users',
    'clients',
    'projects',
    'departments',
    'company_settings',
    'fiscal_info',
    'company_admins',
    'user_permissions'
)
ORDER BY tablename, policyname;
