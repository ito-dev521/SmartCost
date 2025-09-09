-- 残りのCADDON請求データのamountフィールドを修正
-- 新しく追加されたレコードでamountが0のものを修正

-- 1. amountが0またはNULLのレコードを確認
SELECT 
    id,
    billing_month,
    total_amount,
    amount,
    (total_amount - amount) as difference
FROM caddon_billing
WHERE amount IS NULL OR amount = 0;

-- 2. amountが0またはNULLのレコードをtotal_amountで更新
UPDATE caddon_billing 
SET amount = total_amount
WHERE amount IS NULL OR amount = 0;

-- 3. 更新結果を確認
SELECT 
    COUNT(*) as total_records,
    COUNT(total_amount) as records_with_total_amount,
    COUNT(amount) as records_with_amount,
    COUNT(*) - COUNT(amount) as records_without_amount
FROM caddon_billing;

-- 4. 最終確認：すべてのレコードでtotal_amountとamountが一致することを確認
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN total_amount = amount THEN 1 END) as matching_records,
    COUNT(CASE WHEN total_amount != amount THEN 1 END) as mismatched_records
FROM caddon_billing;
