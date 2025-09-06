-- company_idデータを更新

-- 1. 現在のユーザーのcompany_idを確認
SELECT 
    id as user_id,
    email,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 2. 現在のユーザーのcompany_idを取得して変数に格納
DO $$
DECLARE
    current_company_id uuid;
BEGIN
    -- 現在のユーザーのcompany_idを取得
    SELECT company_id INTO current_company_id 
    FROM users 
    WHERE id = auth.uid();
    
    -- デバッグ用：取得したcompany_idを表示
    RAISE NOTICE 'Current company_id: %', current_company_id;
    
    -- 既存のレコードにcompany_idを設定
    UPDATE cost_entries 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
    
    UPDATE daily_reports 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
    
    UPDATE salary_entries 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Updated cost_entries: % rows', (SELECT COUNT(*) FROM cost_entries WHERE company_id = current_company_id);
    RAISE NOTICE 'Updated daily_reports: % rows', (SELECT COUNT(*) FROM daily_reports WHERE company_id = current_company_id);
    RAISE NOTICE 'Updated salary_entries: % rows', (SELECT COUNT(*) FROM salary_entries WHERE company_id = current_company_id);
END $$;

-- 3. 更新後の状況を確認
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
