-- 銀行残高履歴管理テーブル
-- 銀行残高の変動履歴を記録し、AI分析に活用

CREATE TABLE IF NOT EXISTS bank_balance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    balance_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_expense DECIMAL(15,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- ユニーク制約（同じ年度の同じ日付のデータは重複しない）
    UNIQUE(fiscal_year, balance_date),

    -- インデックス
    INDEX idx_bank_balance_history_fiscal_year (fiscal_year),
    INDEX idx_bank_balance_history_date (balance_date),
    INDEX idx_bank_balance_history_created_at (created_at)
);

-- RLSポリシーの設定
ALTER TABLE bank_balance_history ENABLE ROW LEVEL SECURITY;

-- 管理者権限を持つユーザーのみがアクセス可能
CREATE POLICY "admin_access_bank_balance_history" ON bank_balance_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 更新時のタイムスタンプ自動更新
CREATE OR REPLACE FUNCTION update_bank_balance_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_balance_history_updated_at
    BEFORE UPDATE ON bank_balance_history
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_balance_history_updated_at();

-- コメント
COMMENT ON TABLE bank_balance_history IS '銀行残高の履歴管理テーブル';
COMMENT ON COLUMN bank_balance_history.fiscal_year IS '年度';
COMMENT ON COLUMN bank_balance_history.balance_date IS '残高日付';
COMMENT ON COLUMN bank_balance_history.opening_balance IS '期首残高';
COMMENT ON COLUMN bank_balance_history.closing_balance IS '期末残高';
COMMENT ON COLUMN bank_balance_history.total_income IS '総収入額';
COMMENT ON COLUMN bank_balance_history.total_expense IS '総支出額';
COMMENT ON COLUMN bank_balance_history.transaction_count IS '取引件数';


