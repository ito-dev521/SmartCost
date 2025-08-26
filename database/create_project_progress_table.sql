-- project_progressテーブルの作成
CREATE TABLE IF NOT EXISTS project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  progress_rate INTEGER NOT NULL CHECK (progress_rate >= 0 AND progress_rate <= 100),
  progress_date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_project_progress_project_id ON project_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_project_progress_date ON project_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_project_progress_created_by ON project_progress(created_by);

-- RLSポリシーの設定
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の作成した進捗データを閲覧・編集可能
CREATE POLICY "Users can view their own progress data" ON project_progress
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own progress data" ON project_progress
  FOR INSERT WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Users can update their own progress data" ON project_progress
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own progress data" ON project_progress
  FOR DELETE USING (auth.uid() = created_by);

-- 認証されたユーザーは全ての進捗データを閲覧・編集可能
CREATE POLICY "Authenticated users can view all progress data" ON project_progress
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert progress data" ON project_progress
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own progress data" ON project_progress
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own progress data" ON project_progress
  FOR DELETE USING (auth.uid() = created_by);

-- 更新時のタイムスタンプ更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_progress_updated_at 
  BEFORE UPDATE ON project_progress 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
