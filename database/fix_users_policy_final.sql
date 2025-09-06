-- usersテーブルの無限再帰エラーを完全に修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access users in their company" ON users;

-- 新しいポリシーを作成（再帰を完全に避けるため、関数を使用）
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  user_company_id uuid;
BEGIN
  SELECT company_id INTO user_company_id
  FROM public.users
  WHERE id = auth.uid();
  RETURN user_company_id;
END;
$$;

-- 新しいポリシーを作成（関数を使用して再帰を避ける）
CREATE POLICY "Users can only access users in their company" ON users
    FOR ALL USING (
        company_id = public.get_user_company_id()
        OR id = auth.uid()  -- 自分のレコードは常にアクセス可能
    );

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users';
