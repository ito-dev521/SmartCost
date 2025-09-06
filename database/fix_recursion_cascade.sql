-- 依存関係を解決して無限再帰エラーを修正

-- 1. 全てのポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;
DROP POLICY IF EXISTS "Users can only access clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can only access projects in their company" ON projects;
DROP POLICY IF EXISTS "Users can only access departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can only access their company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can only access fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Users can only access company admins in their company" ON company_admins;
DROP POLICY IF EXISTS "Users can only access user permissions in their company" ON user_permissions;

-- 2. 関数を削除
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- 3. 新しい関数を作成（SECURITY DEFINERでRLSをバイパス）
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

-- 4. 新しいポリシーを作成
-- usersテーブル（再帰を避けるため、直接条件を記述）
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

-- 他のテーブル（関数を使用）
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access clients in their company" ON clients
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access projects in their company" ON projects
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access departments in their company" ON departments
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access their company settings" ON company_settings
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access fiscal info in their company" ON fiscal_info
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can only access company admins in their company" ON company_admins
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

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
