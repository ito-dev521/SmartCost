-- bank_balance_historyテーブルのcompany_idカラムを確認・追加

-- 1. 現在のテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bank_balance_history'
ORDER BY ordinal_position;

-- 2. company_idカラムを追加（強制的に）
ALTER TABLE bank_balance_history 
ADD COLUMN company_id uuid;

-- 3. 追加後のテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bank_balance_history'
ORDER BY ordinal_position;

-- 4. 現在のユーザーのcompany_idを確認
SELECT 
    id as user_id,
    email,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 5. 全会社のIDを確認
SELECT 
    id,
    name,
    email
FROM companies 
ORDER BY created_at ASC;

-- 6. 手動で最初の会社のIDを設定
UPDATE bank_balance_history 
SET company_id = (
    SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
);

-- 7. 更新後の状況を確認
SELECT 
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM bank_balance_history;
