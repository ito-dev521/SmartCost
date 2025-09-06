-- 現在のユーザーの権限とアクセス状況を確認

-- 1. 現在のユーザー情報を確認
SELECT 
    id,
    email,
    name,
    role,
    company_id
FROM users 
WHERE id = auth.uid();

-- 2. ユーザーの会社情報を確認
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.email as company_email
FROM companies c
JOIN users u ON c.id = u.company_id
WHERE u.id = auth.uid();

-- 3. 現在のユーザーがアクセスできるデータの範囲を確認
-- プロジェクト数
SELECT COUNT(*) as project_count FROM projects WHERE company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
);

-- クライアント数
SELECT COUNT(*) as client_count FROM clients WHERE company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
);

-- 原価エントリー数
SELECT COUNT(*) as cost_entry_count FROM cost_entries WHERE company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
);

-- 作業日報数
SELECT COUNT(*) as daily_report_count FROM daily_reports WHERE company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
);

-- 4. 全データ数（比較用）
SELECT 
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM cost_entries) as total_cost_entries,
    (SELECT COUNT(*) FROM daily_reports) as total_daily_reports;
