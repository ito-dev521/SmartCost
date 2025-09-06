-- companiesテーブルのRLSポリシーを修正

-- companiesテーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;

-- companiesテーブルの正しいRLSポリシーを作成
-- companiesテーブルは自身のidを主キーとして持つため、
-- ユーザーのcompany_idと一致するidのレコードのみアクセス可能
CREATE POLICY "Users can only access their own company" ON companies
    FOR ALL USING (
        id = (
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
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'companies'
ORDER BY policyname;
