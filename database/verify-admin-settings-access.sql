-- admin_settingsテーブルのアクセス権限を確認
SELECT
    schemaname,
    tablename,
    rowsecurity,
    policies.polname,
    policies.polcmd,
    policies.polroles,
    policies.polqual,
    policies.polwithcheck
FROM pg_tables t
LEFT JOIN pg_policies policies ON t.tablename = policies.tablename
WHERE t.tablename = 'admin_settings'
  AND t.schemaname = 'public';

-- admin_settingsテーブルの現在のデータを確認
SELECT * FROM admin_settings;

-- RLSが有効かどうかを確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'admin_settings' AND schemaname = 'public';

-- テーブルの権限を確認
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'admin_settings';








