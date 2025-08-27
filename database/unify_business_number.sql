-- project_numberを削除してbusiness_numberに統一
-- 1. project_number列を削除
ALTER TABLE projects DROP COLUMN IF EXISTS project_number;

-- 2. 現在の状況を確認
SELECT 
    id,
    name,
    business_number,
    status,
    created_at
FROM projects 
ORDER BY name;

-- 3. business_numberがNULLのプロジェクトを確認
SELECT 
    id,
    name,
    business_number,
    status
FROM projects 
WHERE business_number IS NULL
ORDER BY name;





