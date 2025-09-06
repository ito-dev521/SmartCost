-- user_permissionsテーブルの重複ポリシーをクリーンアップ

-- 既存の重複ポリシーを削除
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;

-- 1つのポリシーのみを残す
-- "Users can only access user permissions in their company" ポリシーは既に存在するので、そのまま使用

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
