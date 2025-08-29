-- 既存のテーブルを削除
DROP TABLE IF EXISTS project_progress CASCADE;

-- シンプルなproject_progressテーブルを作成
CREATE TABLE project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  progress_rate INTEGER NOT NULL CHECK (progress_rate >= 0 AND progress_rate <= 100),
  progress_date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本的なインデックスを作成
CREATE INDEX idx_project_progress_project_id ON project_progress(project_id);
CREATE INDEX idx_project_progress_date ON project_progress(progress_date);

-- RLSは一時的に無効化（テスト用）
-- ALTER TABLE project_progress DISABLE ROW LEVEL SECURITY;

-- テスト用のサンプルデータを挿入（必要に応じて）
-- INSERT INTO project_progress (project_id, progress_rate, progress_date, notes, created_by)
-- SELECT 
--   p.id,
--   0,
--   CURRENT_DATE,
--   '初期進捗',
--   (SELECT id FROM auth.users LIMIT 1)
-- FROM projects p
-- LIMIT 5;







