-- salary_entriesテーブルに一般管理費フィールドを追加
ALTER TABLE salary_entries 
ADD COLUMN IF NOT EXISTS overhead_labor_cost DECIMAL(12,2) DEFAULT 0;

-- 既存のレコードの一般管理費を0に設定
UPDATE salary_entries 
SET overhead_labor_cost = 0 
WHERE overhead_labor_cost IS NULL;

-- コメントを追加
COMMENT ON COLUMN salary_entries.overhead_labor_cost IS '一般管理費として計上される人件費';


