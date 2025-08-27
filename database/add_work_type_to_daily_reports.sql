-- 作業日報テーブルにwork_typeフィールドを追加
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS work_type VARCHAR(10) DEFAULT 'hours' CHECK (work_type IN ('hours', 'time'));

-- 既存のレコードをデフォルト値で更新
UPDATE daily_reports SET work_type = 'hours' WHERE work_type IS NULL;

-- コメントの追加
COMMENT ON COLUMN daily_reports.work_type IS '工数タイプ: hours（工数管理）または time（時間管理）';

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_daily_reports_work_type ON daily_reports(work_type);

