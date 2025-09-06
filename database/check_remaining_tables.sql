-- 残りのテーブルを確認

-- 1. 全テーブル一覧を確認
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. company_idカラムが存在するテーブルを確認
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'company_id'
ORDER BY table_name;

-- 3. bank_balance_historyテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bank_balance_history'
ORDER BY ordinal_position;
