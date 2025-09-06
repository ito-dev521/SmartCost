-- テーブル構造の確認
-- 各テーブルのカラム情報を確認

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'companies',
    'users', 
    'projects',
    'clients',
    'cost_entries',
    'daily_reports',
    'salary_entries',
    'company_settings',
    'user_permissions',
    'departments'
)
ORDER BY table_name, ordinal_position;
