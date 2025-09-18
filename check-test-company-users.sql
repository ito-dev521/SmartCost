-- テスト会社10のユーザー状況を確認するSQL

-- 1. usersテーブルでテスト会社10のユーザーを確認
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.company_id,
  c.name as company_name,
  u.created_at
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE c.name = 'テスト会社10' OR u.email IN (
  'ito.dev@ii-stylelab.com',
  'iis001@ii-stylelab.com', 
  'pro@ii-stylelab.com',
  'sachiko@ii-stylelab.com'
)
ORDER BY u.created_at;

-- 2. auth.usersテーブルでテスト会社10のユーザーを確認
-- 注意: auth.usersはSupabaseの管理テーブルなので、直接クエリできない場合があります
-- 代わりに、Supabase DashboardまたはAuth Admin APIを使用してください

-- 3. テスト会社10の会社情報を確認
SELECT id, name FROM companies WHERE name = 'テスト会社10';

-- 4. 全ユーザーの会社情報を確認
SELECT 
  u.email,
  u.name,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
ORDER BY c.name, u.name;
