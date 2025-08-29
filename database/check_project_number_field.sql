-- project_numberフィールドの状況を確認
-- 1. テーブル構造の確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'project_number';

-- 2. 現在のプロジェクトデータの確認
SELECT 
    id,
    name,
    project_number,
    status,
    created_at
FROM projects 
ORDER BY name;

-- 3. project_numberがNULLのプロジェクトを確認
SELECT 
    id,
    name,
    project_number,
    status
FROM projects 
WHERE project_number IS NULL
ORDER BY name;

-- 4. project_numberが設定されているプロジェクトを確認
SELECT 
    id,
    name,
    project_number,
    status
FROM projects 
WHERE project_number IS NOT NULL
ORDER BY name;










