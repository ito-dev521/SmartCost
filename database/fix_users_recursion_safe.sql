-- usersテーブルの無限再帰を完全に解決（安全版）

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 2. 新しいポリシーを作成（usersテーブルへの参照を完全に排除）
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        -- 自分のレコードは常にアクセス可能
        id = auth.uid()
        OR 
        -- 同じ会社のユーザーにアクセス可能（SECURITY DEFINER関数のみ使用）
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
