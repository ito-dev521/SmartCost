-- projectsテーブルに業務番号フィールドを追加するスクリプト

-- 1. 現在のテーブル構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 2. project_numberフィールドを追加
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_number VARCHAR(50);

-- 3. 既存のプロジェクトに業務番号を設定
-- 道路設計プロジェクト
UPDATE projects 
SET project_number = 'E04-031'
WHERE name = '道路設計';

-- 地下埋設物とれーすプロジェクト
UPDATE projects 
SET project_number = 'E04-032'
WHERE name = '地下埋設物とれーす';

-- 4. 更新後の確認
SELECT 
  id,
  project_number,
  name,
  status,
  updated_at
FROM projects
ORDER BY created_at DESC;

-- 5. 業務番号の一意性制約を追加（必要に応じて）
-- ALTER TABLE projects ADD CONSTRAINT uk_projects_project_number UNIQUE (project_number);

-- 6. インデックスを追加（必要に応じて）
-- CREATE INDEX IF NOT EXISTS idx_projects_project_number ON projects(project_number);


