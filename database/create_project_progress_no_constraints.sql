-- 既存のテーブルを削除
DROP TABLE IF EXISTS project_progress CASCADE;

-- 外部キー制約なしでproject_progressテーブルを作成
CREATE TABLE project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  progress_rate INTEGER NOT NULL CHECK (progress_rate >= 0 AND progress_rate <= 100),
  progress_date DATE NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL, -- UUID制約を削除
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本的なインデックスを作成
CREATE INDEX idx_project_progress_project_id ON project_progress(project_id);
CREATE INDEX idx_project_progress_date ON project_progress(progress_date);

-- RLSは無効化
-- ALTER TABLE project_progress DISABLE ROW LEVEL SECURITY;

-- テーブル構造の確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_progress'
ORDER BY ordinal_position;







