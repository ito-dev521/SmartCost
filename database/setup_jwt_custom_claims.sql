-- JWT Custom Claims設定（長期的解決策）
-- ログイン時にユーザーのcompany_idをJWTにセットすることで、RLSで安全にcompany_idを参照可能にする

-- ===== 1. JWT設定用の関数を作成 =====
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

-- ===== 2. 関数に必要な権限を付与 =====
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon;

-- ===== 3. この関数をSupabaseのauth.hookに登録する設定 =====
/*
注意: この設定はSupabaseダッシュボードまたはSQL Editorで実行する必要があります：

Supabaseダッシュボード → Authentication → Hooks → Custom Access Token Hook
Function name: public.custom_access_token_hook

または以下のSQL（service roleで実行）:
*/

-- ===== 4. JWT custom claimsを使用したRLSポリシーの例 =====

-- 既存のポリシーを削除してから新しいポリシーを作成

-- usersテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "users_jwt_company_access" ON users;
CREATE POLICY "users_jwt_company_access" ON users
    FOR ALL USING (
        -- 自分自身のレコードは常にアクセス可能
        id = auth.uid() 
        OR
        -- 同じ会社のユーザーもアクセス可能（JWT custom claimsを使用）
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- companiesテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "companies_jwt_access" ON companies;
CREATE POLICY "companies_jwt_access" ON companies
    FOR ALL USING (
        id = (auth.jwt() ->> 'company_id')::uuid
    );

-- clientsテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "clients_jwt_company_access" ON clients;
CREATE POLICY "clients_jwt_company_access" ON clients
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- projectsテーブル用のRLSポリシー（JWT使用版）
DROP POLICY IF EXISTS "projects_jwt_company_access" ON projects;
CREATE POLICY "projects_jwt_company_access" ON projects
    FOR ALL USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid
    );

-- ===== 5. テスト用のクエリ =====

-- 現在のJWT内容を確認
SELECT auth.jwt();

-- 現在のユーザーのcompany_idを確認
SELECT auth.jwt() ->> 'company_id' as jwt_company_id;

-- ===== 6. 適用手順 =====
/*
1. この関数をSupabaseで実行
2. Supabaseダッシュボードでcustom access token hookを設定
3. 一度ログアウト・ログインしてJWTを更新
4. 上記のJWTベースのRLSポリシーを適用

これにより、無限再帰なしで安全なcompany_idベースのRLSが実現できます。
*/

-- ===== 7. ロールバック用（必要に応じて） =====
/*
-- フックを削除する場合
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- ポリシーを削除する場合
DROP POLICY IF EXISTS "users_jwt_company_access" ON users;
DROP POLICY IF EXISTS "companies_jwt_access" ON companies;
DROP POLICY IF EXISTS "clients_jwt_company_access" ON clients;
DROP POLICY IF EXISTS "projects_jwt_company_access" ON projects;
*/
