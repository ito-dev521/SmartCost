-- CADDON請求データのamountフィールドを修正
-- total_amountとamountの整合性を確保

-- 1. 現在の状況を確認
SELECT 
    COUNT(*) as total_records,
    COUNT(total_amount) as records_with_total_amount,
    COUNT(amount) as records_with_amount,
    COUNT(*) - COUNT(amount) as records_without_amount
FROM caddon_billing;

-- 2. amountフィールドをtotal_amountで更新（NULLまたは0の場合のみ）
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

-- 4. サンプルデータを確認
SELECT 
    id,
    billing_month,
    caddon_usage_fee,
    initial_setup_fee,
    support_fee,
    total_amount,
    amount,
    (caddon_usage_fee + initial_setup_fee + support_fee) as calculated_total
FROM caddon_billing
ORDER BY billing_month DESC
LIMIT 5;
