-- 管理者権限のポリシーを修正

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
        id = auth.uid()
        OR company_id = public.get_user_company_id()
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

-- 5. cost_entriesテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access cost entries in their company" ON cost_entries;
CREATE POLICY "Users can only access cost entries in their company" ON cost_entries
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 6. daily_reportsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access daily reports in their company" ON daily_reports;
CREATE POLICY "Users can only access daily reports in their company" ON daily_reports
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 7. salary_entriesテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can only access salary entries in their company" ON salary_entries;
CREATE POLICY "Users can only access salary entries in their company" ON salary_entries
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
    'cost_entries',
    'daily_reports',
    'salary_entries'
)
ORDER BY tablename, policyname;
