-- bank_balance_historyテーブルの作成
CREATE TABLE IF NOT EXISTS bank_balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  balance_date DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_bank_balance_history_fiscal_year ON bank_balance_history(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_bank_balance_history_balance_date ON bank_balance_history(balance_date);

-- RLSポリシーの設定
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;

-- スーパー管理者のみアクセス可能
CREATE POLICY "super_admin_all_access" ON bank_balance_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_balance_history_updated_at 
  BEFORE UPDATE ON bank_balance_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- テーブル作成完了メッセージ
SELECT 'bank_balance_historyテーブルが正常に作成されました' as message;


