-- 最後の重複ポリシーを削除

-- salary_entriesテーブルの重複ポリシーを削除
DROP POLICY IF EXISTS "Users can view own salary entries" ON salary_entries;

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'cost_entries',
    'daily_reports',
    'salary_entries'
)
ORDER BY tablename, policyname;
