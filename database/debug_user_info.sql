-- 現在のユーザー情報をデバッグ

-- 1. 現在のユーザー情報を確認
SELECT 
    id as user_id,
    email,
    name,
    role,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 2. 全ユーザー情報を確認（比較用）
SELECT 
    id,
    email,
    name,
    role,
    company_id
FROM users 
ORDER BY created_at DESC
LIMIT 5;

-- 3. 会社情報を確認
SELECT 
    id,
    name,
    email
FROM companies 
ORDER BY created_at DESC
LIMIT 5;

-- 4. 手動でcompany_idを設定（最初の会社のIDを使用）
-- 注意: これは一時的な解決策です
UPDATE cost_entries 
SET company_id = (
    SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
WHERE company_id IS NULL;

UPDATE daily_reports 
SET company_id = (
    SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
WHERE company_id IS NULL;

UPDATE salary_entries 
SET company_id = (
    SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
WHERE company_id IS NULL;

-- 5. 更新後の状況を確認
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
