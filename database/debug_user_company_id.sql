-- 現在のユーザーのcompany_idをデバッグ

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

-- 3. 全ユーザーのcompany_id分布を確認
SELECT 
    company_id,
    COUNT(*) as user_count
FROM users
GROUP BY company_id
ORDER BY company_id;

-- 4. 全会社のIDを確認
SELECT 
    id,
    name,
    email
FROM companies 
ORDER BY created_at ASC;

-- 5. 現在のユーザーのcompany_idを手動で設定（もしNULLの場合）
UPDATE users 
SET company_id = (
    SELECT id FROM companies ORDER BY created_at ASC LIMIT 1
)
WHERE id = auth.uid() AND company_id IS NULL;

-- 6. 更新後のユーザー情報を確認
SELECT 
    id,
    email,
    name,
    role,
    company_id
FROM users 
WHERE id = auth.uid();

-- 7. get_user_company_id()関数の動作確認
SELECT public.get_user_company_id() as function_result;
