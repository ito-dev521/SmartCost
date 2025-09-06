-- bank_balance_historyテーブルにcompany_idカラムを追加してRLSを適用

-- 1. company_idカラムを追加
ALTER TABLE bank_balance_history 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2. 既存データにcompany_idを設定（現在のユーザーの会社IDを使用）
UPDATE bank_balance_history 
SET company_id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
)
WHERE company_id IS NULL;

-- 3. company_idカラムをNOT NULLに設定
ALTER TABLE bank_balance_history ALTER COLUMN company_id SET NOT NULL;

-- 4. 外部キー制約を追加
ALTER TABLE bank_balance_history ADD CONSTRAINT fk_bank_balance_history_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 5. RLSを有効化してポリシーを作成
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access bank balance history in their company" ON bank_balance_history;
CREATE POLICY "Users can only access bank balance history in their company" ON bank_balance_history
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
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
