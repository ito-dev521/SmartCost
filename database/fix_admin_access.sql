-- 管理者権限を持つユーザーが全てのデータにアクセスできるようにRLSポリシーを修正

-- 1. companiesテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 2. usersテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 3. clientsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 4. projectsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 5. departmentsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;
CREATE POLICY "Users can only access departments in their company" ON departments
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 6. company_settingsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;
CREATE POLICY "Users can only access their company settings" ON company_settings
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 7. fiscal_infoテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;
CREATE POLICY "Users can only access fiscal info in their company" ON fiscal_info
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 8. company_adminsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;
CREATE POLICY "Users can only access company admins in their company" ON company_admins
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
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
    'company_admins'
)
ORDER BY tablename, policyname;
