-- 緊急修正：RLS無限再帰エラーの解決
-- JWT custom claimsが設定されていないため、一時的にRLSを無効化またはシンプルな方式に変更

-- ===== オプション1: 完全にRLSを無効化（緊急時のみ） =====
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fiscal_info DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_admins DISABLE ROW LEVEL SECURITY;

-- ===== オプション2: シンプルなRLSポリシー（推奨） =====

-- 1. usersテーブル：自分のレコードのみアクセス可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存の問題のあるポリシーをすべて削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "users_select_own_and_company" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;

-- 新しいシンプルなポリシー
CREATE POLICY "users_own_record_only" ON users
    FOR ALL USING (id = auth.uid());

-- 2. 他のテーブル：一時的に認証済みユーザーすべてにアクセス許可
-- companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
DROP POLICY IF EXISTS "companies_access_own" ON companies;
CREATE POLICY "companies_authenticated_access" ON companies
    FOR ALL USING (auth.role() = 'authenticated');

-- clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
DROP POLICY IF EXISTS "clients_access_company" ON clients;
CREATE POLICY "clients_authenticated_access" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
DROP POLICY IF EXISTS "projects_access_company" ON projects;
CREATE POLICY "projects_authenticated_access" ON projects
    FOR ALL USING (auth.role() = 'authenticated');

-- departmentsテーブル
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;
DROP POLICY IF EXISTS "departments_access_company" ON departments;
CREATE POLICY "departments_authenticated_access" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

-- company_settingsテーブル
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;
DROP POLICY IF EXISTS "company_settings_access_own" ON company_settings;
CREATE POLICY "company_settings_authenticated_access" ON company_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- fiscal_infoテーブル
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "fiscal_info_access_company" ON fiscal_info;
CREATE POLICY "fiscal_info_authenticated_access" ON fiscal_info
    FOR ALL USING (auth.role() = 'authenticated');

-- company_adminsテーブル
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;
DROP POLICY IF EXISTS "company_admins_access_company" ON company_admins;
CREATE POLICY "company_admins_authenticated_access" ON company_admins
    FOR ALL USING (auth.role() = 'authenticated');

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
    cmd
FROM pg_policies 
WHERE tablename IN (
    'users', 'companies', 'clients', 'projects', 'departments',
    'company_settings', 'fiscal_info', 'company_admins'
)
ORDER BY tablename, policyname;

-- ===== コメント =====
/*
この緊急修正により：
1. usersテーブルでは無限再帰が解決される（自分のレコードのみアクセス）
2. 他のテーブルでは認証済みユーザーすべてがアクセス可能（セキュリティは低下するが動作する）
3. アプリケーション層でcompany_idによるフィルタリングを行う必要がある

長期的には、JWT custom claimsまたはSupabase Edge Functionsを使用して
適切なcompany_id制限を実装することを推奨します。
*/

