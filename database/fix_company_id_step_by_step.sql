-- company_idカラムを段階的に修正

-- 1. まず、既存のNULL値を確認
SELECT 
    'cost_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM cost_entries
UNION ALL
SELECT 
    'daily_reports' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM daily_reports
UNION ALL
SELECT 
    'salary_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM salary_entries;

-- 2. 現在のユーザーのcompany_idを取得
SELECT 
    id as user_id,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 3. 既存のNULL値を現在のユーザーのcompany_idで更新
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

-- 4. 更新後の状況を確認
SELECT 
    'cost_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM cost_entries
UNION ALL
SELECT 
    'daily_reports' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM daily_reports
UNION ALL
SELECT 
    'salary_entries' as table_name,
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM salary_entries;
