-- 各テーブルのカラム構造を確認

-- 1. cost_entriesテーブルの構造
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cost_entries'
ORDER BY ordinal_position;

-- 2. daily_reportsテーブルの構造
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'daily_reports'
ORDER BY ordinal_position;

-- 3. salary_entriesテーブルの構造
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'salary_entries'
ORDER BY ordinal_position;

-- 4. 全テーブルでcompany_idカラムが存在するか確認
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'company_id'
ORDER BY table_name;
