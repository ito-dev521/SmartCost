-- テーブル構造を確認

-- 1. companiesテーブルの構造
SELECT 
    'companies' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies'
ORDER BY ordinal_position;

-- 2. usersテーブルの構造
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. 他のテーブルのcompany_idカラム存在確認
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as company_id_status
FROM (
    SELECT DISTINCT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'clients', 'projects', 'cost_entries', 
        'daily_reports', 'salary_entries', 'bank_balance_history'
    )
) t
LEFT JOIN information_schema.columns c 
    ON c.table_schema = 'public' 
    AND c.table_name = t.table_name 
    AND c.column_name = 'company_id'
ORDER BY t.table_name;
