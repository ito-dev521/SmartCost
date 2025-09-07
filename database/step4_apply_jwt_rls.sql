-- Step 4: JWT Custom Claims を使用した安全なRLSポリシーの適用
-- 注意: この手順は JWT に company_id が正しく設定されていることを確認してから実行してください

-- usersテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "users_authenticated_access" ON users;
DROP POLICY IF EXISTS "users_own_record_only" ON users;
CREATE POLICY "users_jwt_company_access" ON users
    FOR ALL USING (
        -- 自分自身のレコードは常にアクセス可能
        id = auth.uid() 
        OR
        -- 同じ会社のユーザーもアクセス可能（JWT custom claimsを使用）
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- companiesテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "companies_authenticated_access" ON companies;
CREATE POLICY "companies_jwt_access" ON companies
    FOR ALL USING (
        id = (auth.jwt() ->> 'company_id')::uuid
    );

-- clientsテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "clients_authenticated_access" ON clients;
CREATE POLICY "clients_jwt_company_access" ON clients
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- projectsテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "projects_authenticated_access" ON projects;
CREATE POLICY "projects_jwt_company_access" ON projects
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- 他のテーブルも同様に設定...

-- 確認用クエリ
SELECT 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'companies', 'clients', 'projects')
ORDER BY tablename, policyname;

