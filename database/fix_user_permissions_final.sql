-- user_permissionsテーブルのポリシーを完全にクリーンアップ

-- 全ての既存ポリシーを削除
DROP POLICY IF EXISTS "Admins can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can only access user permissions in their company" ON user_permissions;

-- 新しい統一されたポリシーを作成
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
