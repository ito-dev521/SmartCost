-- Step 3: JWT Custom Claims のテスト

-- 現在のJWT内容を確認（ログイン後に実行）
SELECT auth.jwt() as current_jwt;

-- JWTからcompany_idを取得できるかテスト
SELECT 
    auth.jwt() ->> 'company_id' as jwt_company_id,
    auth.jwt() ->> 'user_role' as jwt_user_role,
    auth.jwt() ->> 'email' as jwt_email;

-- 現在のユーザーの実際のcompany_idと比較
SELECT 
    id as user_id,
    company_id as actual_company_id,
    role as actual_role,
    email as actual_email
FROM users 
WHERE id = auth.uid();

-- JWTのcompany_idと実際のcompany_idが一致するかチェック
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'company_id')::uuid = u.company_id 
        THEN '✅ JWT company_id 一致' 
        ELSE '❌ JWT company_id 不一致' 
    END as status,
    (auth.jwt() ->> 'company_id')::uuid as jwt_company_id,
    u.company_id as actual_company_id
FROM users u
WHERE u.id = auth.uid();

