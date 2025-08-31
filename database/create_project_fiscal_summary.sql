-- 年度別契約額・実績サマリの作成
CREATE TABLE IF NOT EXISTS project_fiscal_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  opening_contract_amount NUMERIC(14,2) NOT NULL DEFAULT 0,   -- 当年度の期首契約額（繰越）
  year_revenue_recognized NUMERIC(14,2) NOT NULL DEFAULT 0,   -- 当年度の収益認識合計
  closing_carryover_amount NUMERIC(14,2) NOT NULL DEFAULT 0,  -- 翌年度へ繰越額
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, fiscal_year)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_pfs_project ON project_fiscal_summary(project_id);
CREATE INDEX IF NOT EXISTS idx_pfs_year ON project_fiscal_summary(fiscal_year);

-- タイムスタンプ更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pfs_updated_at ON project_fiscal_summary;
CREATE TRIGGER trg_pfs_updated_at
  BEFORE UPDATE ON project_fiscal_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


