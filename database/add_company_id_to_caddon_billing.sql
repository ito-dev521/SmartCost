-- caddon_billingテーブルにcompany_idカラムを追加
ALTER TABLE caddon_billing ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 既存のCADDON請求データのcompany_idを設定
UPDATE caddon_billing 
SET company_id = p.company_id
FROM projects p
WHERE caddon_billing.project_id = p.id;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_caddon_billing_company_id ON caddon_billing(company_id);

-- RLSポリシーの更新（会社IDベースのアクセス制御）
DROP POLICY IF EXISTS "Admins can manage all caddon billing" ON caddon_billing;
DROP POLICY IF EXISTS "Users can view caddon billing" ON caddon_billing;

-- 管理者は全データを閲覧・編集可能
CREATE POLICY "Admins can manage all caddon billing" ON caddon_billing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 一般ユーザーは自分の会社のデータのみ閲覧可能
CREATE POLICY "Users can view own company caddon billing" ON caddon_billing
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- コメントの更新
COMMENT ON COLUMN caddon_billing.company_id IS '所属会社ID（マルチテナント対応）';
