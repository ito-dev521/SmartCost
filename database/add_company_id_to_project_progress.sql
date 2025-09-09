-- project_progressテーブルにcompany_idカラムを追加
-- マルチテナント対応のため

-- 1. company_idカラムを追加
ALTER TABLE project_progress 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. 既存データのcompany_idを更新（プロジェクトテーブルから取得）
UPDATE project_progress 
SET company_id = projects.company_id
FROM projects 
WHERE project_progress.project_id = projects.id;

-- 3. 更新結果を確認
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as records_without_company_id
FROM project_progress;

-- 4. company_idをNOT NULLに設定（すべてのレコードにcompany_idが設定されている場合のみ）
-- 注意: このコマンドは、すべてのレコードにcompany_idが設定されている場合のみ実行してください
-- ALTER TABLE project_progress 
-- ALTER COLUMN company_id SET NOT NULL;

-- 5. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_project_progress_company_id 
ON project_progress(company_id);

-- 6. RLSポリシーを更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view progress for their company projects" ON project_progress;
DROP POLICY IF EXISTS "Users can insert progress for their company projects" ON project_progress;
DROP POLICY IF EXISTS "Users can update progress for their company projects" ON project_progress;
DROP POLICY IF EXISTS "Users can delete progress for their company projects" ON project_progress;

-- 新しいポリシーを作成
CREATE POLICY "Users can view progress for their company projects" ON project_progress
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert progress for their company projects" ON project_progress
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update progress for their company projects" ON project_progress
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete progress for their company projects" ON project_progress
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
FROM project_progress;
