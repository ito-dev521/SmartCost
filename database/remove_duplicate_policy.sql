-- user_permissionsテーブルの重複ポリシーを削除

-- 重複しているSELECTポリシーを削除
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;

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
