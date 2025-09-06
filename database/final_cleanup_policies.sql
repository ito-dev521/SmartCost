-- 残りの重複ポリシーをクリーンアップ

-- 1. fiscal_infoテーブルの重複ポリシーを削除
DROP POLICY IF EXISTS "Users can delete fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Users can insert fiscal info in their company" ON fiscal_info;
DROP POLICY IF EXISTS "Users can update fiscal info in their company" ON fiscal_info;

-- 2. projectsテーブルの重複ポリシーを削除
DROP POLICY IF EXISTS "Allow anon users to view projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to view projects" ON projects;

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
