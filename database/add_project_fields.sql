-- プロジェクトテーブルに新しいフィールドを追加

-- 業務番号フィールドを追加（既存のシステムで使用されている場合のため）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'projects' AND column_name = 'business_number') THEN
        ALTER TABLE projects ADD COLUMN business_number VARCHAR(50);
        CREATE UNIQUE INDEX idx_projects_business_number ON projects(business_number) WHERE business_number IS NOT NULL;
    END IF;
END $$;

-- 注文書名フィールドを追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'projects' AND column_name = 'order_form_name') THEN
        ALTER TABLE projects ADD COLUMN order_form_name VARCHAR(255);
    END IF;
END $$;

-- 担当者フィールドを追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'projects' AND column_name = 'person_in_charge') THEN
        ALTER TABLE projects ADD COLUMN person_in_charge VARCHAR(255);
    END IF;
END $$;

-- 完了メッセージ
SELECT 'プロジェクトテーブルの新しいフィールドが追加されました' as message;