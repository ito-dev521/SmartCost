-- 安全なRLSポリシーを適用

-- 1. usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        -- 自分のレコードは常にアクセス可能
        id = auth.uid()
        OR 
        -- 同じ会社のユーザーにアクセス可能
        company_id = public.get_user_company_id()
    );

-- 2. companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = public.get_user_company_id()
    );

-- 3. clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = public.get_user_company_id()
    );

-- 4. projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = public.get_user_company_id()
    );

-- 5. cost_entriesテーブル
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access cost entries in their company" ON cost_entries;
CREATE POLICY "Users can only access cost entries in their company" ON cost_entries
    FOR ALL USING (
        company_id = public.get_user_company_id()
    );

-- 6. daily_reportsテーブル
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access daily reports in their company" ON daily_reports;
CREATE POLICY "Users can only access daily reports in their company" ON daily_reports
    FOR ALL USING (
        company_id = public.get_user_company_id()
    );

-- 7. salary_entriesテーブル
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access salary entries in their company" ON salary_entries;
CREATE POLICY "Users can only access salary entries in their company" ON salary_entries
    FOR ALL USING (
        company_id = public.get_user_company_id()
    );

-- 8. bank_balance_historyテーブル
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access bank balance history in their company" ON bank_balance_history;
CREATE POLICY "Users can only access bank balance history in their company" ON bank_balance_history
    FOR ALL USING (
        company_id = public.get_user_company_id()
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
    'users',
    'companies',
    'clients',
    'projects',
    'cost_entries',
    'daily_reports',
    'salary_entries',
    'bank_balance_history'
)
ORDER BY tablename, policyname;
