-- 外部キー制約を一時的に無効化（テスト用）
-- 注意: 本番環境では使用しないでください

-- project_progressテーブルの外部キー制約を確認
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='project_progress';

-- 外部キー制約を一時的に無効化
ALTER TABLE project_progress DROP CONSTRAINT IF EXISTS project_progress_created_by_fkey;

-- 制約が削除されたか確認
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
WHERE tc.table_name='project_progress';





