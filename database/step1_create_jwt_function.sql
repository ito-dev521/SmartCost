-- Step 1: JWT Custom Claims 関数を作成

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    claims jsonb;
    user_company_id uuid;
    user_role text;
BEGIN
    -- JWTのペイロードから基本的なclaimsを取得
    claims := event->'claims';
    
    -- ユーザーのcompany_idとroleを取得
    SELECT company_id, role 
    INTO user_company_id, user_role
    FROM public.users 
    WHERE id = (event->>'user_id')::uuid;
    
    -- company_idが取得できた場合のみJWTに追加
    IF user_company_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id::text));
    END IF;
    
    -- roleもJWTに追加
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    END IF;
    
    -- 更新されたeventを返す
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 関数に必要な権限を付与
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon;

-- 確認用: 関数が作成されたかチェック
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'custom_access_token_hook';

