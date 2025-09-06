-- 現在のユーザーの権限状況を確認

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

-- 3. ユーザーの権限を確認
SELECT 
    up.*
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.id = auth.uid();

-- 4. スーパー管理者かどうか確認
SELECT 
    id,
    email,
    name
FROM super_admins
WHERE id = auth.uid();
