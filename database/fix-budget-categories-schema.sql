-- budget_categoriesテーブルのスキーマを修正
-- 問題: updated_atカラムが不足している可能性

-- 1. updated_atカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_categories' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE budget_categories 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. company_idカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_categories' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE budget_categories 
        ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        
        -- 既存データにデフォルトの会社IDを設定
        UPDATE budget_categories 
        SET company_id = (
            SELECT id FROM companies LIMIT 1
        )
        WHERE company_id IS NULL;
        
        -- company_idをNOT NULLに設定
        ALTER TABLE budget_categories 
        ALTER COLUMN company_id SET NOT NULL;
        
        -- インデックスを追加
        CREATE INDEX IF NOT EXISTS idx_budget_categories_company_id 
        ON budget_categories(company_id);
    END IF;
END $$;

-- 3. RLSポリシーを確認・追加
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can access budget categories of their company" ON budget_categories;
DROP POLICY IF EXISTS "Super admins can access all budget categories" ON budget_categories;

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

-- 4. テーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'budget_categories' 
ORDER BY ordinal_position;

-- 修正完了メッセージ
SELECT 'budget_categoriesテーブルのスキーマ修正が完了しました' as message;
