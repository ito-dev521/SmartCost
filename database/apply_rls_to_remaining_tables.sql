-- 残りのテーブルにRLSポリシーを適用

-- 1. cost_entriesテーブル
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access cost entries in their company" ON cost_entries;
CREATE POLICY "Users can only access cost entries in their company" ON cost_entries
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 2. daily_reportsテーブル
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access daily reports in their company" ON daily_reports;
CREATE POLICY "Users can only access daily reports in their company" ON daily_reports
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 3. salary_entriesテーブル（もし存在する場合）
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access salary entries in their company" ON salary_entries;
CREATE POLICY "Users can only access salary entries in their company" ON salary_entries
    FOR ALL USING (
        company_id = public.get_user_company_id()
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
    'cost_entries',
    'daily_reports',
    'salary_entries'
)
ORDER BY tablename, policyname;
