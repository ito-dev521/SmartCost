-- テスト会社10のユーザーをauth.usersテーブルに作成するSQL

-- 1. まず、usersテーブルからテスト会社10のユーザーIDを取得
SELECT 
  u.id,
  u.email,
  u.name,
  u.role
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE c.name = 'テスト会社10' OR u.email IN (
  'ito.dev@ii-stylelab.com',
  'iis001@ii-stylelab.com', 
  'pro@ii-stylelab.com',
  'sachiko@ii-stylelab.com'
);

-- 2. auth.usersテーブルにユーザーを作成
-- 注意: 実際のUUIDは上記クエリの結果を使用してください

-- 佐々木登 (管理者)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  (SELECT id FROM users WHERE email = 'ito.dev@ii-stylelab.com'),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'ito.dev@ii-stylelab.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demo123', gen_salt('bf')),
  updated_at = NOW();

-- テスト太郎 (一般ユーザー)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  (SELECT id FROM users WHERE email = 'iis001@ii-stylelab.com'),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'iis001@ii-stylelab.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demo123', gen_salt('bf')),
  updated_at = NOW();

-- 経理のプロ (閲覧者)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  (SELECT id FROM users WHERE email = 'pro@ii-stylelab.com'),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'pro@ii-stylelab.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demo123', gen_salt('bf')),
  updated_at = NOW();

-- さちこ (マネージャー)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  (SELECT id FROM users WHERE email = 'sachiko@ii-stylelab.com'),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'sachiko@ii-stylelab.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demo123', gen_salt('bf')),
  updated_at = NOW();

-- 3. 作成結果を確認
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE c.name = 'テスト会社10'
ORDER BY u.name;
