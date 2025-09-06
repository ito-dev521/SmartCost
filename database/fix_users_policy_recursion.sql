-- usersテーブルの無限再帰エラーを修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 新しいポリシーを作成（再帰を避けるため、直接auth.uid()を使用）
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
        OR id = auth.uid()  -- 自分のレコードは常にアクセス可能
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users';
