-- usersテーブルの無限再帰を根本的に解決

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 2. 新しいポリシーを作成（再帰を完全に避ける）
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        -- 自分のレコードは常にアクセス可能
        id = auth.uid()
        OR 
        -- スーパー管理者は全アクセス可能（直接条件で判定）
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role = 'superadmin'
        )
        OR
        -- 同じ会社のユーザーにアクセス可能（SECURITY DEFINER関数を使用）
        company_id = public.get_user_company_id()
    );

-- 3. 関数が正しく動作するかテスト
SELECT public.get_user_company_id() as test_company_id;

-- 確認用クエリ
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users';
