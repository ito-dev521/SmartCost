-- 管理者アクセス権限を確認

-- 1. 現在のユーザー情報を確認
SELECT 
    id,
    email,
    name,
    role,
    company_id
FROM users 
WHERE id = auth.uid();

-- 2. 現在のユーザーがスーパー管理者かどうか確認
SELECT 
    id,
    email,
    name
FROM super_admins
WHERE id = auth.uid();

-- 3. 現在のユーザーの権限を確認
SELECT 
    up.*
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.id = auth.uid();

-- 4. 全ユーザーのロール分布を確認
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
