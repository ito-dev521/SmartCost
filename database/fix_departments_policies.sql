-- departmentsテーブルの重複ポリシーをクリーンアップ

-- 既存の重複ポリシーを削除
DROP POLICY IF EXISTS "Users can delete departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can insert departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can update departments in their company" ON departments;

-- 1つのポリシーのみを残す
-- "Users can only access departments in their company" ポリシーは既に存在するので、そのまま使用

-- usersテーブルのポリシーを確認・作成
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
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
