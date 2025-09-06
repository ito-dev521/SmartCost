-- 緊急時：RLSを一時的に無効化

-- 全てのテーブルのRLSを無効化
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balance_history DISABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
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
    'user_permissions',
    'cost_entries',
    'daily_reports',
    'salary_entries',
    'bank_balance_history'
)
ORDER BY tablename;
