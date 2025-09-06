-- 既存のポリシーをクリーンアップして、新しいポリシーのみを適用

-- 1. companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON companies;
DROP POLICY IF EXISTS "Enable update for users based on email" ON companies;
DROP POLICY IF EXISTS "Super admins can access everything" ON companies;
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;

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

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 3. clientsテーブル
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;
DROP POLICY IF EXISTS "Users can delete clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their company" ON clients;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 4. projectsテーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view projects in their company" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON projects;
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 5. departmentsテーブル
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view departments in their company" ON departments;
DROP POLICY IF EXISTS "Admins can view all departments" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON departments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON departments;
DROP POLICY IF EXISTS "Super admins can view all departments" ON departments;
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access departments in their company" ON departments
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 6. company_settingsテーブル
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view their company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can view all company settings" ON company_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON company_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON company_settings;
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access their company settings" ON company_settings
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 7. fiscal_infoテーブル
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Admins can view all fiscal info" ON fiscal_info;
DROP POLICY IF EXISTS "Enable read access for all users" ON fiscal_info;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON fiscal_info;
DROP POLICY IF EXISTS "Enable update for users based on email" ON fiscal_info;
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access fiscal info in their company" ON fiscal_info
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 8. company_adminsテーブル
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view company admins in their company" ON company_admins;
DROP POLICY IF EXISTS "Admins can view all company admins" ON company_admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON company_admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON company_admins;
DROP POLICY IF EXISTS "Enable update for users based on email" ON company_admins;
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;

-- 新しいポリシーを作成
CREATE POLICY "Users can only access company admins in their company" ON company_admins
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
