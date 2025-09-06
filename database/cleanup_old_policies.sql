-- 古いポリシーをクリーンアップ

-- 1. daily_reportsテーブルの古いポリシーを削除
DROP POLICY IF EXISTS "Allow anon users to manage daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Allow authenticated users to manage daily reports" ON daily_reports;

-- 2. salary_entriesテーブルの古いポリシーを削除
DROP POLICY IF EXISTS "Super admins can view all salary entries" ON salary_entries;
DROP POLICY IF EXISTS "Users can delete own salary entries" ON salary_entries;
DROP POLICY IF EXISTS "Users can insert own salary entries" ON salary_entries;
DROP POLICY IF EXISTS "Users can update own salary entries" ON salary_entries;

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
