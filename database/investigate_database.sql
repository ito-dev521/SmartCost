-- データベースの詳細調査スクリプト
-- 現在のデータベースの状況を詳しく確認

-- 1. テーブルの存在確認とRLS状況
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 各テーブルの詳細なデータ確認
-- projects テーブル
SELECT 
  'projects' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_count
FROM projects;

-- プロジェクトの詳細
SELECT 
  id,
  name,
  company_id,
  client_name,
  status,
  created_at,
  updated_at
FROM projects
ORDER BY created_at DESC;

-- 3. budget_categories テーブル
SELECT 
  'budget_categories' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as child_categories
FROM budget_categories;

-- カテゴリの階層構造
SELECT 
  id,
  name,
  parent_id,
  level,
  sort_order,
  created_at
FROM budget_categories
ORDER BY level, sort_order, name;

-- 4. companies テーブル
SELECT 
  'companies' as table_name,
  COUNT(*) as total_count
FROM companies;

-- 会社の詳細
SELECT 
  id,
  name,
  created_at,
  updated_at
FROM companies;

-- 5. users テーブル
SELECT 
  'users' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
FROM users;

-- ユーザーの詳細
SELECT 
  id,
  email,
  name,
  role,
  company_id,
  department_id,
  is_active,
  created_at
FROM users
ORDER BY created_at DESC;

-- 6. RLSポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. 外部キー制約の確認
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 8. 認証関連の確認
-- 現在のユーザー情報
SELECT current_user, current_database();

-- 9. サンプルデータの整合性チェック
-- プロジェクトと会社の関連
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.company_id,
  c.name as company_name,
  p.status
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- 10. データの最新性確認
SELECT 
  'projects' as table_name,
  MAX(created_at) as latest_record,
  MIN(created_at) as oldest_record
FROM projects
UNION ALL
SELECT 
  'budget_categories',
  MAX(created_at),
  MIN(created_at)
FROM budget_categories
UNION ALL
SELECT 
  'companies',
  MAX(created_at),
  MIN(created_at)
FROM companies
UNION ALL
SELECT 
  'users',
  MAX(created_at),
  MIN(created_at)
FROM users;









