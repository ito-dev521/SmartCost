-- JWT関数のエラーをデバッグ・修正

-- 1. 現在の関数を確認
SELECT 
    proname,
    prosrc,
    proargnames
FROM pg_proc 
WHERE proname = 'custom_access_token_hook';

-- 2. 既存の関数を削除
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- 3. より安全な関数を作成（エラーハンドリング強化）
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    user_company_id uuid;
    user_role text;
    user_id_param uuid;
BEGIN
    -- エラーハンドリングを追加
    BEGIN
        -- JWTのペイロードから基本的なclaimsを取得
        claims := event->'claims';
        
        -- user_idを取得（NULL チェック）
        user_id_param := (event->>'user_id')::uuid;
        
        -- user_idがNULLの場合は元のeventをそのまま返す
        IF user_id_param IS NULL THEN
            RETURN event;
        END IF;
        
        -- ユーザーのcompany_idとroleを取得（エラーが起きても続行）
        SELECT u.company_id, u.role 
        INTO user_company_id, user_role
        FROM public.users u
        WHERE u.id = user_id_param;
        
        -- company_idが取得できた場合のみJWTに追加
        IF user_company_id IS NOT NULL THEN
            claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id::text));
        END IF;
        
        -- roleが取得できた場合のみJWTに追加
        IF user_role IS NOT NULL THEN
            claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
        END IF;
        
        -- 更新されたeventを返す
        RETURN jsonb_set(event, '{claims}', claims);
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- エラーが発生した場合は元のeventをそのまま返す（ログインを妨げない）
            RETURN event;
    END;
END;
$$;

-- 4. 権限を再設定
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 5. 関数が正常に作成されたか確認
SELECT 
    proname as function_name,
    proowner,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'custom_access_token_hook';

