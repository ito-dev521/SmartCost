-- budget_categoriesテーブルにcompany_idカラムを追加
-- 問題: budget_categoriesテーブルにcompany_idカラムが存在しない
-- 解決: company_idカラムを追加し、既存データにデフォルトの会社IDを設定

-- 1. company_idカラムを追加
ALTER TABLE budget_categories 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. 既存の予算科目データにデフォルトの会社IDを設定
-- サンプル建設コンサルタント株式会社のIDを使用
UPDATE budget_categories 
SET company_id = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
WHERE company_id IS NULL;

-- 3. company_idをNOT NULLに設定
ALTER TABLE budget_categories 
ALTER COLUMN company_id SET NOT NULL;

-- 4. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_budget_categories_company_id 
ON budget_categories(company_id);

-- 5. RLSポリシーを追加
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- 会社のユーザーは自分の会社の予算科目のみアクセス可能
CREATE POLICY "Users can access budget categories of their company" 
ON budget_categories FOR ALL 
TO authenticated 
USING (
  company_id IN (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- スーパーアドミンは全ての予算科目にアクセス可能
CREATE POLICY "Super admins can access all budget categories" 
ON budget_categories FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- 修正完了メッセージ
SELECT 'budget_categoriesテーブルにcompany_idカラムが正常に追加されました' as message;
