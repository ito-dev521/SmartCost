-- split_billingテーブルにcompany_idカラムを追加
-- マルチテナント対応のため

-- 1. company_idカラムを追加
ALTER TABLE split_billing 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. 既存データのcompany_idを更新（プロジェクトテーブルから取得）
UPDATE split_billing 
SET company_id = projects.company_id
FROM projects 
WHERE split_billing.project_id = projects.id;

-- 3. 更新結果を確認
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as records_without_company_id
FROM split_billing;

-- 4. company_idをNOT NULLに設定（すべてのレコードにcompany_idが設定されている場合のみ）
-- 注意: このコマンドは、すべてのレコードにcompany_idが設定されている場合のみ実行してください
-- ALTER TABLE split_billing 
-- ALTER COLUMN company_id SET NOT NULL;

-- 5. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_split_billing_company_id 
ON split_billing(company_id);

-- 6. RLSポリシーを更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view split billing for their company projects" ON split_billing;
DROP POLICY IF EXISTS "Users can insert split billing for their company projects" ON split_billing;
DROP POLICY IF EXISTS "Users can update split billing for their company projects" ON split_billing;
DROP POLICY IF EXISTS "Users can delete split billing for their company projects" ON split_billing;

-- 新しいポリシーを作成
CREATE POLICY "Users can view split billing for their company projects" ON split_billing
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert split billing for their company projects" ON split_billing
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update split billing for their company projects" ON split_billing
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete split billing for their company projects" ON split_billing
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- 7. 最終確認用クエリ
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as records_without_company_id
FROM split_billing;
