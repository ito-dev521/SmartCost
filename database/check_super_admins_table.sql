-- super_adminsテーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'super_admins'
) as super_admins_exists;

-- super_adminsテーブルの構造確認（存在する場合）
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'super_admins'
ORDER BY ordinal_position;
