-- 決算情報テーブル作成
-- 各会社の決算情報（銀行残高、決算月、現在の何期等）を管理

CREATE TABLE fiscal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL, -- 年度（例：2024）
  settlement_month INTEGER NOT NULL CHECK (settlement_month BETWEEN 1 AND 12), -- 決算月（1-12）
  current_period INTEGER NOT NULL DEFAULT 1 CHECK (current_period >= 1), -- 現在の何期
  bank_balance DECIMAL(15,2) NOT NULL DEFAULT 0, -- 銀行残高
  notes TEXT, -- 備考
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, fiscal_year) -- 同一年度の重複を防ぐ
);

-- インデックス作成
CREATE INDEX idx_fiscal_info_company_id ON fiscal_info(company_id);
CREATE INDEX idx_fiscal_info_fiscal_year ON fiscal_info(fiscal_year);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_fiscal_info_updated_at
    BEFORE UPDATE ON fiscal_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 外部キー制約
ALTER TABLE fiscal_info ADD CONSTRAINT fk_fiscal_info_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- RLS有効化
ALTER TABLE fiscal_info ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can view fiscal info in their company" ON fiscal_info
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Users can insert fiscal info in their company" ON fiscal_info
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Users can update fiscal info in their company" ON fiscal_info
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Users can delete fiscal info in their company" ON fiscal_info
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- 初期データ挿入（サンプルデータ）
INSERT INTO fiscal_info (company_id, fiscal_year, settlement_month, current_period, bank_balance, notes)
SELECT
  c.id,
  2024,
  3, -- 3月決算
  1, -- 第1期
  5000000.00, -- 500万円
  '初期設定：2024年度第1期の銀行残高'
FROM companies c
WHERE c.name = 'サンプル建設コンサルタント株式会社';

-- 完了メッセージ
SELECT '決算情報テーブル作成が完了しました' as message;


