-- 部署管理テーブルの追加・修正SQL
-- 既存のdepartmentsテーブルが存在しない場合の作成
-- 注意: 既存のデータがある場合は、実行前にバックアップを取ってください

-- 0. 既存のテーブルが古い構造の場合は削除（データが重要な場合はコメントアウト）
-- DROP TABLE IF EXISTS departments CASCADE;

-- 1. departmentsテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存のテーブルにupdated_atカラムが存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE departments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        -- 既存のレコードのupdated_atをcreated_atと同じ値に設定
        UPDATE departments SET updated_at = created_at WHERE updated_at IS NULL;
    END IF;
END $$;

-- 2. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- 3. 外部キー制約の追加
-- company_idの外部キー制約
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_departments_company_id'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT fk_departments_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- parent_idの外部キー制約（自己参照）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_departments_parent_id'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT fk_departments_parent_id 
        FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. 更新日時自動更新トリガーの作成
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成（既存の場合は削除して再作成）
DROP TRIGGER IF EXISTS trigger_update_departments_updated_at ON departments;
CREATE TRIGGER trigger_update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- 5. RLS（Row Level Security）の有効化
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシーの作成
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can insert departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can update departments in their company" ON departments;
DROP POLICY IF EXISTS "Users can delete departments in their company" ON departments;
DROP POLICY IF EXISTS "Super admins can view all departments" ON departments;

-- ユーザーは自分の会社の部署のみ閲覧・編集可能
CREATE POLICY "Users can view departments in their company" ON departments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert departments in their company" ON departments
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update departments in their company" ON departments
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete departments in their company" ON departments
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid()
        )
    );

-- 7. スーパー管理者は全部署を閲覧可能
CREATE POLICY "Super admins can view all departments" ON departments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE email = auth.jwt() ->> 'email'
            AND is_active = true
        )
    );

-- 8. 初期データの挿入（サンプル会社用）
-- 注意: 既存のデータがある場合は実行しない
INSERT INTO departments (company_id, name, parent_id) 
SELECT 
    c.id as company_id,
    '本社' as name,
    NULL as parent_id
FROM companies c 
WHERE c.name = 'サンプル建設コンサルタント株式会社'
AND NOT EXISTS (
    SELECT 1 FROM departments d 
    WHERE d.company_id = c.id AND d.name = '本社'
);

INSERT INTO departments (company_id, name, parent_id) 
SELECT 
    c.id as company_id,
    '技術部' as name,
    d.id as parent_id
FROM companies c 
CROSS JOIN departments d
WHERE c.name = 'サンプル建設コンサルタント株式会社'
AND d.name = '本社'
AND d.company_id = c.id
AND NOT EXISTS (
    SELECT 1 FROM departments d2 
    WHERE d2.company_id = c.id AND d2.name = '技術部'
);

INSERT INTO departments (company_id, name, parent_id) 
SELECT 
    c.id as company_id,
    '営業部' as name,
    d.id as parent_id
FROM companies c 
CROSS JOIN departments d
WHERE c.name = 'サンプル建設コンサルタント株式会社'
AND d.name = '本社'
AND d.company_id = c.id
AND NOT EXISTS (
    SELECT 1 FROM departments d2 
    WHERE d2.company_id = c.id AND d2.name = '営業部'
);

-- 9. コメントの追加
COMMENT ON TABLE departments IS '部署管理テーブル';
COMMENT ON COLUMN departments.id IS '部署ID';
COMMENT ON COLUMN departments.company_id IS '会社ID';
COMMENT ON COLUMN departments.name IS '部署名';
COMMENT ON COLUMN departments.parent_id IS '親部署ID（階層構造用）';
COMMENT ON COLUMN departments.created_at IS '作成日時';
COMMENT ON COLUMN departments.updated_at IS '更新日時';

-- 10. テーブル構造の確認
-- テーブル構造の確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'departments' 
ORDER BY ordinal_position;

-- 11. 完了メッセージ
SELECT '部署管理テーブルの設定が完了しました' as message;
SELECT 
    '部署数: ' || COUNT(*) as department_count,
    '会社数: ' || (SELECT COUNT(*) FROM companies) as company_count
FROM departments;
