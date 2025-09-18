-- テストユーザーを削除するSQLスクリプト

-- 1. まず、テストユーザーのIDを確認
SELECT id, email, name, company_id FROM users WHERE email = 'test@example.com';

-- 2. 関連するデータを削除（もしあれば）
-- 原価エントリー
DELETE FROM cost_entries WHERE created_by = (SELECT id FROM users WHERE email = 'test@example.com');

-- 作業日報
DELETE FROM daily_reports WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');

-- 給与エントリー
DELETE FROM salary_entries WHERE created_by = (SELECT id FROM users WHERE email = 'test@example.com');

-- 3. ユーザーテーブルから削除
DELETE FROM users WHERE email = 'test@example.com';

-- 4. auth.usersからも削除（もし存在すれば）
-- 注意: auth.usersはSupabaseの管理テーブルなので、直接削除は推奨されません
-- 代わりに、Supabase DashboardまたはAuth Admin APIを使用してください

-- 5. 削除結果を確認
SELECT 'テストユーザー削除完了' as status;

-- 6. 残りのユーザーを確認
SELECT 
  u.email,
  u.name,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
ORDER BY c.name, u.name;
