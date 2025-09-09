-- 決算期途中変更対応のためのテーブル拡張
-- 既存のfiscal_infoテーブルを拡張して、決算期変更履歴を管理

-- 1. 決算期変更履歴テーブルを作成
CREATE TABLE IF NOT EXISTS fiscal_period_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_date DATE NOT NULL, -- 変更日
  from_fiscal_year INTEGER NOT NULL, -- 変更前年度
  from_settlement_month INTEGER NOT NULL, -- 変更前決算月
  to_fiscal_year INTEGER NOT NULL, -- 変更後年度
  to_settlement_month INTEGER NOT NULL, -- 変更後決算月
  reason TEXT, -- 変更理由
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_fiscal_period_changes_company_id ON fiscal_period_changes(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_period_changes_date ON fiscal_period_changes(change_date);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_fiscal_period_changes_updated_at
    BEFORE UPDATE ON fiscal_period_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS有効化
ALTER TABLE fiscal_period_changes ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can view fiscal period changes in their company" ON fiscal_period_changes
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

CREATE POLICY "Users can insert fiscal period changes in their company" ON fiscal_period_changes
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

-- 2. fiscal_infoテーブルに決算期変更フラグを追加
ALTER TABLE fiscal_info 
ADD COLUMN IF NOT EXISTS is_mid_period_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS original_fiscal_year INTEGER,
ADD COLUMN IF NOT EXISTS original_settlement_month INTEGER;

-- 3. 決算期変更時のデータ移行用関数を作成
CREATE OR REPLACE FUNCTION handle_fiscal_period_change(
  p_company_id UUID,
  p_change_date DATE,
  p_from_fiscal_year INTEGER,
  p_from_settlement_month INTEGER,
  p_to_fiscal_year INTEGER,
  p_to_settlement_month INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_old_fiscal_info RECORD;
  v_new_fiscal_info RECORD;
BEGIN
  -- 変更履歴を記録
  INSERT INTO fiscal_period_changes (
    company_id, change_date, from_fiscal_year, from_settlement_month,
    to_fiscal_year, to_settlement_month, reason, created_by
  ) VALUES (
    p_company_id, p_change_date, p_from_fiscal_year, p_from_settlement_month,
    p_to_fiscal_year, p_to_settlement_month, p_reason, p_created_by
  );

  -- 現在の決算情報を取得
  SELECT * INTO v_old_fiscal_info
  FROM fiscal_info
  WHERE company_id = p_company_id
  AND fiscal_year = p_from_fiscal_year
  ORDER BY created_at DESC
  LIMIT 1;

  -- 新しい決算情報を作成
  INSERT INTO fiscal_info (
    company_id, fiscal_year, settlement_month, current_period,
    bank_balance, notes, is_mid_period_change, change_reason,
    original_fiscal_year, original_settlement_month
  ) VALUES (
    p_company_id, p_to_fiscal_year, p_to_settlement_month, 1,
    COALESCE(v_old_fiscal_info.bank_balance, 0),
    '決算期途中変更: ' || p_from_fiscal_year || '年' || p_from_settlement_month || '月 → ' || p_to_fiscal_year || '年' || p_to_settlement_month || '月',
    TRUE, p_reason, p_from_fiscal_year, p_from_settlement_month
  ) RETURNING * INTO v_new_fiscal_info;

  -- プロジェクトの年度別サマリを調整
  -- 既存のプロジェクトを新しい年度に移行
  UPDATE project_fiscal_summary
  SET fiscal_year = p_to_fiscal_year
  WHERE project_id IN (
    SELECT id FROM projects WHERE company_id = p_company_id
  )
  AND fiscal_year = p_from_fiscal_year;

  -- 結果を返す
  v_result := json_build_object(
    'success', TRUE,
    'old_fiscal_info', row_to_json(v_old_fiscal_info),
    'new_fiscal_info', row_to_json(v_new_fiscal_info),
    'message', '決算期変更が完了しました'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. 決算期変更の影響範囲を確認する関数
CREATE OR REPLACE FUNCTION analyze_fiscal_period_change_impact(
  p_company_id UUID,
  p_from_fiscal_year INTEGER,
  p_from_settlement_month INTEGER,
  p_to_fiscal_year INTEGER,
  p_to_settlement_month INTEGER
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_project_count INTEGER;
  v_revenue_impact DECIMAL;
  v_cost_impact DECIMAL;
BEGIN
  -- 影響を受けるプロジェクト数を計算
  SELECT COUNT(*) INTO v_project_count
  FROM projects
  WHERE company_id = p_company_id;

  -- 収入への影響を計算
  SELECT COALESCE(SUM(contract_amount), 0) INTO v_revenue_impact
  FROM projects
  WHERE company_id = p_company_id
  AND contract_amount > 0;

  -- 原価への影響を計算
  SELECT COALESCE(SUM(amount), 0) INTO v_cost_impact
  FROM cost_entries
  WHERE company_id = p_company_id;

  v_result := json_build_object(
    'project_count', v_project_count,
    'revenue_impact', v_revenue_impact,
    'cost_impact', v_cost_impact,
    'recommendations', ARRAY[
      'プロジェクトの支払予定日を再計算してください',
      '年間入金予定表を更新してください',
      '資金管理の予測を再計算してください',
      '年度別サマリを確認してください'
    ]
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 完了メッセージ
SELECT '決算期途中変更対応のテーブル拡張が完了しました' as message;
