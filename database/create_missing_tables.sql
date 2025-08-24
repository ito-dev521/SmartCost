-- 不足しているテーブルを作成するスクリプト
-- 注意: 既存のテーブルがある場合はエラーが発生する可能性があります

-- cost_entries テーブルの作成
CREATE TABLE IF NOT EXISTS cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  company_name VARCHAR(255), -- 一般管理費用の会社名
  entry_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  entry_type VARCHAR(50) NOT NULL DEFAULT 'direct', -- 'direct', 'indirect', 'general_admin'
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_cost_entries_project_id ON cost_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_category_id ON cost_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_entry_date ON cost_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cost_entries_entry_type ON cost_entries(entry_type);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_cost_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_cost_entries_updated_at
    BEFORE UPDATE ON cost_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_entries_updated_at();

-- サンプルデータの挿入（必要に応じて）
-- プロジェクトが存在する場合のみ挿入
INSERT INTO cost_entries (project_id, category_id, entry_date, amount, description, entry_type, created_at)
SELECT 
  p.id,
  bc.id,
  '2024-01-15',
  500000,
  'サンプル原価データ',
  'direct',
  NOW()
FROM projects p, budget_categories bc
WHERE p.status = 'active' 
AND bc.name = '人件費'
LIMIT 1
ON CONFLICT DO NOTHING;

-- テーブルの作成確認
SELECT 
  'cost_entries' as table_name,
  COUNT(*) as row_count
FROM cost_entries
UNION ALL
SELECT 
  'projects' as table_name,
  COUNT(*) as row_count
FROM projects
UNION ALL
SELECT 
  'budget_categories' as table_name,
  COUNT(*) as row_count
FROM budget_categories
UNION ALL
SELECT 
  'companies' as table_name,
  COUNT(*) as row_count
FROM companies;

-- テーブル構造の確認
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('cost_entries', 'projects', 'budget_categories')
ORDER BY table_name, ordinal_position;

