-- 無限再帰エラーを根本的に解決

-- 1. 既存の関数を削除
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- 2. 新しい関数を作成（SECURITY DEFINERでRLSをバイパス）
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  user_company_id uuid;
BEGIN
  -- SECURITY DEFINERにより、この関数はRLSをバイパスしてusersテーブルにアクセス
  SELECT company_id INTO user_company_id
  FROM public.users
  WHERE id = auth.uid();
  RETURN user_company_id;
END;
$$;

-- 3. usersテーブルのポリシーを修正（関数を使用せずに直接条件を記述）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 新しいポリシーを作成（再帰を完全に避ける）
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        -- 自分のレコードは常にアクセス可能
        id = auth.uid()
        OR 
        -- 同じ会社のユーザーにアクセス可能（直接サブクエリを使用）
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
        OR
        -- スーパー管理者は全アクセス可能
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 4. 他のテーブルのポリシーも修正（関数を使用）
-- companiesテーブル
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

-- clientsテーブル
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

-- projectsテーブル
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

-- departmentsテーブル
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

-- company_settingsテーブル
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

-- fiscal_infoテーブル
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

-- company_adminsテーブル
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

-- user_permissionsテーブル
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
