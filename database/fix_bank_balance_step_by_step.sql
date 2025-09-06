-- bank_balance_historyテーブルを段階的に修正

-- 1. 現在の状況を確認
SELECT 
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM bank_balance_history;

-- 2. 現在のユーザーのcompany_idを確認
SELECT 
    id as user_id,
    email,
    company_id as user_company_id
FROM users 
WHERE id = auth.uid();

-- 3. 既存のNULL値を現在のユーザーのcompany_idで更新
UPDATE bank_balance_history 
SET company_id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
)
WHERE company_id IS NULL;

-- 4. 更新後の状況を確認
SELECT 
    COUNT(*) as total_rows,
    COUNT(company_id) as non_null_company_id,
    COUNT(*) - COUNT(company_id) as null_company_id
FROM bank_balance_history;

-- 5. company_idカラムをNOT NULLに設定
ALTER TABLE bank_balance_history ALTER COLUMN company_id SET NOT NULL;

-- 6. 外部キー制約を追加
ALTER TABLE bank_balance_history ADD CONSTRAINT fk_bank_balance_history_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 7. RLSを有効化してポリシーを作成
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access bank balance history in their company" ON bank_balance_history;
CREATE POLICY "Users can only access bank balance history in their company" ON bank_balance_history
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'bank_balance_history';
