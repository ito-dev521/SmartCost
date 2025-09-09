-- CADDON請求データのcompany_idを修正
-- company_idがnullのレコードを正しい会社IDで更新

-- 1. company_idがnullのレコードを確認
SELECT 
    id,
    billing_month,
    amount,
    total_amount,
    company_id,
    project_id
FROM caddon_billing
WHERE company_id IS NULL;

-- 2. プロジェクトから正しいcompany_idを取得して更新
UPDATE caddon_billing 
SET company_id = (
    SELECT p.company_id 
    FROM projects p 
    WHERE p.id = caddon_billing.project_id
)
WHERE company_id IS NULL;

-- 3. 更新結果を確認
SELECT 
    id,
    billing_month,
    amount,
    total_amount,
    company_id,
    project_id
FROM caddon_billing
WHERE billing_month IN ('2025-11', '2026-02')
ORDER BY billing_month;

-- 4. 最終確認：すべてのレコードでcompany_idが設定されていることを確認
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as records_without_company_id
FROM caddon_billing;
