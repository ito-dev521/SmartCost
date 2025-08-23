-- 作業日報テーブルの作成
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_content TEXT NOT NULL,
    work_hours DECIMAL(5,2) NOT NULL CHECK (work_hours >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, date);

-- 更新時のタイムスタンプ更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_reports_updated_at 
    BEFORE UPDATE ON daily_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS（Row Level Security）の有効化
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分の作業日報のみ閲覧・編集可能
CREATE POLICY "Users can view own daily reports" ON daily_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily reports" ON daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily reports" ON daily_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily reports" ON daily_reports
    FOR DELETE USING (auth.uid() = user_id);

-- スーパー管理者は全作業日報を閲覧可能
CREATE POLICY "Super admins can view all daily reports" ON daily_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_metadata 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- コメントの追加
COMMENT ON TABLE daily_reports IS '作業日報テーブル';
COMMENT ON COLUMN daily_reports.id IS '作業日報ID';
COMMENT ON COLUMN daily_reports.user_id IS 'ユーザーID';
COMMENT ON COLUMN daily_reports.date IS '作業日';
COMMENT ON COLUMN daily_reports.project_id IS 'プロジェクトID';
COMMENT ON COLUMN daily_reports.work_content IS '作業内容';
COMMENT ON COLUMN daily_reports.work_hours IS '工数（時間）';
COMMENT ON COLUMN daily_reports.notes IS '備考';
COMMENT ON COLUMN daily_reports.created_at IS '作成日時';
COMMENT ON COLUMN daily_reports.updated_at IS '更新日時';
