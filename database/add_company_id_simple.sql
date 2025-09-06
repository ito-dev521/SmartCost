-- company_idカラムを追加（シンプル版）

-- 1. cost_entriesテーブルにcompany_idカラムを追加
ALTER TABLE cost_entries 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2. daily_reportsテーブルにcompany_idカラムを追加
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- 3. salary_entriesテーブルにcompany_idカラムを追加
ALTER TABLE salary_entries 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- 4. 現在のユーザーのcompany_idを取得
SELECT 
    id as user_id,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 5. 既存データにcompany_idを設定
UPDATE cost_entries 
SET company_id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
)
WHERE company_id IS NULL;

UPDATE daily_reports 
SET company_id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
)
WHERE company_id IS NULL;

UPDATE salary_entries 
SET company_id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
)
WHERE company_id IS NULL;

-- 6. 確認用クエリ
SELECT 
    'cost_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id
FROM cost_entries
UNION ALL
SELECT 
    'daily_reports' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id
FROM daily_reports
UNION ALL
SELECT 
    'salary_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id
FROM salary_entries;
