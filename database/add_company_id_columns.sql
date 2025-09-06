-- 必要なテーブルにcompany_idカラムを追加

-- 1. cost_entriesテーブルにcompany_idカラムを追加
ALTER TABLE cost_entries 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- 2. daily_reportsテーブルにcompany_idカラムを追加
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- 3. salary_entriesテーブルにcompany_idカラムを追加
ALTER TABLE salary_entries 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- 4. 既存データにcompany_idを設定（現在のユーザーの会社IDを使用）
-- 注意: これは一時的な設定です。実際の運用では、各レコードの適切なcompany_idを設定する必要があります

-- 現在のユーザーのcompany_idを取得
DO $$
DECLARE
    current_company_id uuid;
BEGIN
    SELECT company_id INTO current_company_id 
    FROM users 
    WHERE id = auth.uid();
    
    -- 既存のレコードにcompany_idを設定
    UPDATE cost_entries 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
    
    UPDATE daily_reports 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
    
    UPDATE salary_entries 
    SET company_id = current_company_id 
    WHERE company_id IS NULL;
END $$;

-- 5. company_idカラムをNOT NULLに設定
ALTER TABLE cost_entries ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE daily_reports ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE salary_entries ALTER COLUMN company_id SET NOT NULL;

-- 確認用クエリ
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('cost_entries', 'daily_reports', 'salary_entries')
AND column_name = 'company_id'
ORDER BY table_name;
