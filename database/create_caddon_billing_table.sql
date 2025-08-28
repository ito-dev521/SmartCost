-- CADDON請求管理テーブルの作成
CREATE TABLE IF NOT EXISTS caddon_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL, -- 請求月
  caddon_usage_fee DECIMAL(10,2) NOT NULL, -- CADDON利用料
  support_fee DECIMAL(10,2) NOT NULL, -- サポート料
  total_amount DECIMAL(10,2) NOT NULL, -- 合計金額
  billing_status VARCHAR(20) DEFAULT 'pending', -- 請求状況: pending, confirmed, billed
  notes TEXT, -- 備考
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_caddon_billing_project_client_month ON caddon_billing(project_id, client_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_caddon_billing_client_month ON caddon_billing(client_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_caddon_billing_month ON caddon_billing(billing_month);

-- 更新時のタイムスタンプ更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_caddon_billing_updated_at 
    BEFORE UPDATE ON caddon_billing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS（Row Level Security）の有効化
ALTER TABLE caddon_billing ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- 管理者は全データを閲覧・編集可能
CREATE POLICY "Admins can manage all caddon billing" ON caddon_billing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 一般ユーザーは閲覧のみ可能
CREATE POLICY "Users can view caddon billing" ON caddon_billing
    FOR SELECT USING (true);

-- コメントの追加
COMMENT ON TABLE caddon_billing IS 'CADDON請求管理テーブル';
COMMENT ON COLUMN caddon_billing.id IS 'CADDON請求ID';
COMMENT ON COLUMN caddon_billing.project_id IS 'プロジェクトID';
COMMENT ON COLUMN caddon_billing.client_id IS 'クライアントID';
COMMENT ON COLUMN caddon_billing.billing_month IS '請求月';
COMMENT ON COLUMN caddon_billing.caddon_usage_fee IS 'CADDON利用料';
COMMENT ON COLUMN caddon_billing.support_fee IS 'サポート料';
COMMENT ON COLUMN caddon_billing.total_amount IS '合計金額';
COMMENT ON COLUMN caddon_billing.billing_status IS '請求状況';
COMMENT ON COLUMN caddon_billing.notes IS '備考';
COMMENT ON COLUMN caddon_billing.created_at IS '作成日時';
COMMENT ON COLUMN caddon_billing.updated_at IS '更新日時';

