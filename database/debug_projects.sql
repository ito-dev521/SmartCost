-- プロジェクトデータのデバッグ用スクリプト

-- 1. 現在のprojectsテーブルの構造を確認
SELECT 'projectsテーブルの構造:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 2. 現在のprojectsテーブルのデータを確認
SELECT 'projectsテーブルの全データ:' as info;
SELECT id, name, company_id, status, created_at 
FROM projects 
ORDER BY name;

-- 3. 現在のユーザーデータを確認
SELECT 'usersテーブルの全データ:' as info;
SELECT id, email, company_id, role 
FROM users 
ORDER BY email;

-- 4. 現在のsuper_adminsデータ確認
SELECT 'super_adminsテーブルの全データ:' as info;
SELECT id, email, name, is_active 
FROM super_admins 
ORDER BY email;

-- 5. 現在のcompaniesデータ確認
SELECT 'companiesテーブルの全データ:' as info;
SELECT id, name 
FROM companies 
ORDER BY name;

-- 6. RLSポリシーの確認
SELECT 'projectsテーブルのRLSポリシー:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- 7. 認証情報の確認
SELECT '現在の認証情報:' as info;
SELECT current_user, session_user, current_database();

-- 8. テーブルの権限確認
SELECT 'projectsテーブルの権限:' as info;
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'projects';
