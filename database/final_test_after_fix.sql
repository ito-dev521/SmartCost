-- 修正後の最終テスト

-- 1. 現在のユーザー情報を確認
SELECT 
    'Current User Info' as test_type,
    auth.uid() as user_id,
    u.email,
    u.role,
    u.company_id,
    c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.id = auth.uid();

-- 2. 各テーブルのデータアクセステスト
SELECT 'Users Table Access' as test_type, COUNT(*) as accessible_records FROM users;
SELECT 'Companies Table Access' as test_type, COUNT(*) as accessible_records FROM companies;
SELECT 'Clients Table Access' as test_type, COUNT(*) as accessible_records FROM clients;
SELECT 'Projects Table Access' as test_type, COUNT(*) as accessible_records FROM projects;
SELECT 'Cost Entries Table Access' as test_type, COUNT(*) as accessible_records FROM cost_entries;
SELECT 'Daily Reports Table Access' as test_type, COUNT(*) as accessible_records FROM daily_reports;
SELECT 'Salary Entries Table Access' as test_type, COUNT(*) as accessible_records FROM salary_entries;
SELECT 'Bank Balance History Table Access' as test_type, COUNT(*) as accessible_records FROM bank_balance_history;
