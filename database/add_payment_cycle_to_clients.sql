-- clientsテーブルに入金サイクル関連フィールドを追加
-- 既存のテーブルに新しいカラムを追加するマイグレーション

-- 入金サイクル関連フィールドを追加（IF NOT EXISTSで安全に追加）
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_cycle_type VARCHAR(50) DEFAULT 'month_end',
ADD COLUMN IF NOT EXISTS payment_cycle_closing_day INTEGER DEFAULT 31,
ADD COLUMN IF NOT EXISTS payment_cycle_payment_month_offset INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_cycle_payment_day INTEGER DEFAULT 31,
ADD COLUMN IF NOT EXISTS payment_cycle_description VARCHAR(255);

-- 既存のレコードにデフォルト値を設定
UPDATE clients 
SET 
  payment_cycle_type = 'month_end',
  payment_cycle_closing_day = 31,
  payment_cycle_payment_month_offset = 1,
  payment_cycle_payment_day = 31,
  payment_cycle_description = '月末締め翌月末払い'
WHERE payment_cycle_type IS NULL;

-- コメントを追加
COMMENT ON COLUMN clients.payment_cycle_type IS '入金サイクルタイプ（month_end: 月末締め, specific_date: 特定日締め）';
COMMENT ON COLUMN clients.payment_cycle_closing_day IS '締め日（1-31）';
COMMENT ON COLUMN clients.payment_cycle_payment_month_offset IS '支払い月オフセット（0: 当月, 1: 翌月, 2: 2ヶ月後）';
COMMENT ON COLUMN clients.payment_cycle_payment_day IS '支払い日（1-31）';
COMMENT ON COLUMN clients.payment_cycle_description IS '入金サイクルの説明（例：月末締め翌月末払い）';

-- インデックスを作成（必要に応じて）
CREATE INDEX IF NOT EXISTS idx_clients_payment_cycle_type ON clients(payment_cycle_type);
CREATE INDEX IF NOT EXISTS idx_clients_payment_cycle_closing_day ON clients(payment_cycle_closing_day);
