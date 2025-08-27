-- RLS問題のデバッグスクリプト
-- 認証とRLSポリシーの問題を特定

-- 1. 現在の認証状況を確認
-- 注意: このクエリは認証されたユーザーでのみ実行可能
SELECT 
  'Current Auth Info' as info,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_user_email,
  auth.jwt() ->> 'role' as current_user_role;

-- 2. RLSポリシーの詳細確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
    WHEN qual LIKE '%auth.jwt()%' THEN 'Uses auth.jwt()'
    ELSE 'No auth reference'
  END as auth_usage
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. プロジェクトテーブルのRLSポリシー詳細
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'projects';

-- 4. ユーザーと会社の関連性チェック
-- 現在のユーザーがどの会社に所属しているか
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  u.company_id,
  c.name as company_name,
  u.is_active
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = COALESCE(auth.jwt() ->> 'email', 'unknown@example.com');

-- 5. プロジェクトのアクセス可能性テスト
-- 現在のユーザーがアクセスできるプロジェクト
SELECT 
  p.id,
  p.name,
  p.company_id,
  p.status,
  c.name as company_name
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.status = 'active'
AND (
  p.company_id IN (
    SELECT company_id FROM users
    WHERE id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
  ) OR
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE email = COALESCE(auth.jwt() ->> 'email', 'unknown@example.com')
    AND is_active = true
  )
);

-- 6. スーパー管理者の確認
SELECT 
  'Super Admins' as info,
  COUNT(*) as count
FROM super_admins
WHERE is_active = true;

-- スーパー管理者の詳細
SELECT 
  id,
  email,
  name,
  is_active,
  created_at
FROM super_admins
WHERE is_active = true;

-- 7. RLSポリシーの条件をテスト
-- プロジェクトテーブルのRLS条件を分解してテスト
SELECT 
  'RLS Test 1: User Company Check' as test_name,
  COUNT(*) as accessible_projects
FROM projects p
WHERE p.company_id IN (
  SELECT company_id FROM users
  WHERE id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
);

SELECT 
  'RLS Test 2: Super Admin Check' as test_name,
  COUNT(*) as super_admin_projects
FROM projects p
WHERE EXISTS (
  SELECT 1 FROM super_admins
  WHERE email = COALESCE(auth.jwt() ->> 'email', 'unknown@example.com')
  AND is_active = true
);

SELECT 
  'RLS Test 3: Specific Company Check' as test_name,
  COUNT(*) as specific_company_projects
FROM projects p
WHERE p.company_id IN (
  SELECT id FROM companies
  WHERE name = 'サンプル建設コンサルタント株式会社'
);

-- 8. 認証なしでのデータアクセステスト
-- RLSが無効化されている場合のテスト
SELECT 
  'No Auth Test' as test_name,
  COUNT(*) as total_projects
FROM projects
WHERE status = 'active';

-- 9. 問題の特定
-- どの条件でプロジェクトが取得できないか
SELECT 
  'Problem Analysis' as analysis,
  CASE 
    WHEN auth.uid() IS NULL THEN 'No authenticated user'
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) THEN 'User not in users table'
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND company_id IS NOT NULL) THEN 'User has no company'
    WHEN NOT EXISTS (SELECT 1 FROM super_admins WHERE email = auth.jwt() ->> 'email' AND is_active = true) THEN 'Not a super admin'
    ELSE 'Other issue'
  END as issue_type;

-- 10. 推奨される解決策
SELECT 
  'Recommended Solution' as solution,
  CASE 
    WHEN auth.uid() IS NULL THEN 'Enable authentication in the application'
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) THEN 'Create user record in users table'
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND company_id IS NOT NULL) THEN 'Assign company_id to user'
    WHEN NOT EXISTS (SELECT 1 FROM super_admins WHERE email = auth.jwt() ->> 'email' AND is_active = true) THEN 'Create super admin record or fix email'
    ELSE 'Check RLS policies and user permissions'
  END as action_required;





