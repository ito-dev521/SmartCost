-- データベース状態確認
SELECT
    tablename,
    hasindexes,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
