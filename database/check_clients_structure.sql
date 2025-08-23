-- clientsテーブルの現在の構造を確認
-- このスクリプトを実行してから、必要に応じてマイグレーションを実行してください

-- 1. テーブルの存在確認
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') 
        THEN 'clientsテーブルは存在します' 
        ELSE 'clientsテーブルは存在しません' 
    END as table_status;

-- 2. 現在のカラム一覧
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 3. 入金サイクル関連カラムの存在確認
SELECT 
    'payment_cycle_type' as column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_type') 
        THEN '存在します' 
        ELSE '存在しません' 
    END as status
UNION ALL
SELECT 
    'payment_cycle_closing_day' as column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_closing_day') 
        THEN '存在します' 
        ELSE '存在しません' 
    END as status
UNION ALL
SELECT 
    'payment_cycle_payment_month_offset' as column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_month_offset') 
        THEN '存在します' 
        ELSE '存在しません' 
    END as status
UNION ALL
SELECT 
    'payment_cycle_payment_day' as column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_day') 
        THEN '存在します' 
        ELSE '存在しません' 
    END as status
UNION ALL
SELECT 
    'payment_cycle_description' as column_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_description') 
        THEN '存在します' 
        ELSE '存在しません' 
    END as status;

-- 4. レコード数
SELECT COUNT(*) as total_records FROM clients;

-- 5. サンプルデータ（最初の3件）
SELECT * FROM clients LIMIT 3;



