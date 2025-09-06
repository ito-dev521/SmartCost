-- 現在のユーザーの状況を確認

-- 1. 現在のユーザー情報を確認
SELECT 
    id,
    email,
    name,
    role,
    company_id
FROM users 
WHERE id = auth.uid();

-- 2. 現在のユーザーの会社情報を確認
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.email as company_email
FROM companies c
JOIN users u ON c.id = u.company_id
WHERE u.id = auth.uid();

-- 3. get_user_company_id()関数の動作確認
SELECT public.get_user_company_id() as function_result;

-- 4. 現在のユーザーがスーパー管理者かどうか確認
SELECT 
    id,
    email,
    name
FROM super_admins
WHERE id = auth.uid();
