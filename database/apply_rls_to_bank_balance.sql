-- bank_balance_historyテーブルにRLSポリシーを適用

-- 1. company_idカラムをNOT NULLに設定
ALTER TABLE bank_balance_history ALTER COLUMN company_id SET NOT NULL;

-- 2. 外部キー制約を追加
ALTER TABLE bank_balance_history ADD CONSTRAINT fk_bank_balance_history_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- 3. RLSを有効化してポリシーを作成
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
