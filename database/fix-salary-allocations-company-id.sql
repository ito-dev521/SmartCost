-- salary_allocationsテーブルにcompany_idカラムを追加
-- 給与データ保存エラーの修正

-- 1. salary_allocationsテーブルにcompany_idカラムを追加
ALTER TABLE salary_allocations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. 既存データのcompany_idを更新（salary_entriesテーブルから取得）
UPDATE salary_allocations 
SET company_id = se.company_id
FROM salary_entries se
WHERE salary_allocations.salary_entry_id = se.id;

-- 3. 更新結果を確認
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as records_without_company_id
FROM salary_allocations;

-- 4. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_salary_allocations_company_id 
ON salary_allocations(company_id);

-- 5. RLSポリシーを更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view salary allocations for their company" ON salary_allocations;
DROP POLICY IF EXISTS "Users can insert salary allocations for their company" ON salary_allocations;
DROP POLICY IF EXISTS "Users can update salary allocations for their company" ON salary_allocations;
DROP POLICY IF EXISTS "Users can delete salary allocations for their company" ON salary_allocations;

-- 新しいポリシーを作成
CREATE POLICY "Users can view salary allocations for their company" ON salary_allocations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert salary allocations for their company" ON salary_allocations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update salary allocations for their company" ON salary_allocations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete salary allocations for their company" ON salary_allocations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );
