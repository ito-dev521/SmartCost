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

-- 3. salary_entriesテーブル
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

-- 4. company_idカラムをNOT NULLに設定
ALTER TABLE cost_entries ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE daily_reports ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE salary_entries ALTER COLUMN company_id SET NOT NULL;

-- 5. 外部キー制約を追加
ALTER TABLE cost_entries ADD CONSTRAINT fk_cost_entries_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_reports_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE salary_entries ADD CONSTRAINT fk_salary_entries_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

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
