-- 給与入力テーブルの作成
CREATE TABLE IF NOT EXISTS salary_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    employee_department VARCHAR(255),
    salary_amount DECIMAL(15,2) NOT NULL CHECK (salary_amount > 0),
    salary_period_start DATE NOT NULL,
    salary_period_end DATE NOT NULL,
    total_work_hours DECIMAL(8,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 給与配分テーブルの作成
CREATE TABLE IF NOT EXISTS salary_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_entry_id UUID NOT NULL REFERENCES salary_entries(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_hours DECIMAL(8,2) NOT NULL CHECK (work_hours >= 0),
    hourly_rate DECIMAL(10,2) NOT NULL,
    labor_cost DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_salary_entries_employee_name ON salary_entries(employee_name);
CREATE INDEX IF NOT EXISTS idx_salary_entries_period ON salary_entries(salary_period_start, salary_period_end);
CREATE INDEX IF NOT EXISTS idx_salary_entries_created_by ON salary_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_salary_allocations_salary_entry_id ON salary_allocations(salary_entry_id);
CREATE INDEX IF NOT EXISTS idx_salary_allocations_project_id ON salary_allocations(project_id);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_salary_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_salary_entries_updated_at
    BEFORE UPDATE ON salary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_salary_entries_updated_at();

-- RLS（Row Level Security）の有効化
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_allocations ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分の作成した給与エントリーのみ閲覧・編集可能
CREATE POLICY "Users can view own salary entries" ON salary_entries
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own salary entries" ON salary_entries
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own salary entries" ON salary_entries
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own salary entries" ON salary_entries
    FOR DELETE USING (auth.uid() = created_by);

-- 給与配分も同様
CREATE POLICY "Users can view own salary allocations" ON salary_allocations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM salary_entries
            WHERE id = salary_allocations.salary_entry_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert own salary allocations" ON salary_allocations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM salary_entries
            WHERE id = salary_allocations.salary_entry_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update own salary allocations" ON salary_allocations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM salary_entries
            WHERE id = salary_allocations.salary_entry_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete own salary allocations" ON salary_allocations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM salary_entries
            WHERE id = salary_allocations.salary_entry_id
            AND created_by = auth.uid()
        )
    );

-- スーパー管理者は全給与エントリーを閲覧可能
CREATE POLICY "Super admins can view all salary entries" ON salary_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can view all salary allocations" ON salary_allocations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

-- コメントの追加
COMMENT ON TABLE salary_entries IS '給与入力テーブル';
COMMENT ON TABLE salary_allocations IS '給与配分テーブル';
COMMENT ON COLUMN salary_entries.id IS '給与エントリーID';
COMMENT ON COLUMN salary_entries.employee_name IS '社員名';
COMMENT ON COLUMN salary_entries.employee_department IS '部署';
COMMENT ON COLUMN salary_entries.salary_amount IS '給与総額';
COMMENT ON COLUMN salary_entries.salary_period_start IS '給与期間開始日';
COMMENT ON COLUMN salary_entries.salary_period_end IS '給与期間終了日';
COMMENT ON COLUMN salary_entries.total_work_hours IS '総工数';
COMMENT ON COLUMN salary_entries.hourly_rate IS '時給単価';
COMMENT ON COLUMN salary_entries.notes IS '備考';
COMMENT ON COLUMN salary_entries.created_by IS '作成者ID';
COMMENT ON COLUMN salary_entries.created_at IS '作成日時';
COMMENT ON COLUMN salary_entries.updated_at IS '更新日時';

COMMENT ON COLUMN salary_allocations.id IS '給与配分ID';
COMMENT ON COLUMN salary_allocations.salary_entry_id IS '給与エントリーID';
COMMENT ON COLUMN salary_allocations.project_id IS 'プロジェクトID';
COMMENT ON COLUMN salary_allocations.work_hours IS '工数';
COMMENT ON COLUMN salary_allocations.hourly_rate IS '時給単価';
COMMENT ON COLUMN salary_allocations.labor_cost IS '人件費';
COMMENT ON COLUMN salary_allocations.created_at IS '作成日時';






