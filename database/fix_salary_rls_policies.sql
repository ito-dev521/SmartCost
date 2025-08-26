-- 給与入力機能のためのRLSポリシー修正
-- 作成日: 2024-12-01

-- 既存のポリシーを削除（必要に応じて）
-- DROP POLICY IF EXISTS "Users can view users in their company" ON users;
-- DROP POLICY IF EXISTS "Users can view departments in their company" ON departments;
-- DROP POLICY IF EXISTS "Users can view budget categories" ON budget_categories;

-- usersテーブルのRLSポリシー
-- ユーザーは自分の会社のユーザー一覧を閲覧可能
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view users in their company'
    ) THEN
        CREATE POLICY "Users can view users in their company" ON users
          FOR SELECT USING (
            company_id IN (
              SELECT company_id FROM users
              WHERE id = auth.uid()
            ) OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            )
          );
    END IF;
END $$;

-- departmentsテーブルのRLSポリシー
-- ユーザーは自分の会社の部署一覧を閲覧可能
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'departments' 
        AND policyname = 'Users can view departments in their company'
    ) THEN
        CREATE POLICY "Users can view departments in their company" ON departments
          FOR SELECT USING (
            company_id IN (
              SELECT company_id FROM users
              WHERE id = auth.uid()
            ) OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            )
          );
    END IF;
END $$;

-- budget_categoriesテーブルのRLSポリシー
-- 全ユーザーが予算科目を閲覧可能
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'budget_categories' 
        AND policyname = 'Users can view budget categories'
    ) THEN
        CREATE POLICY "Users can view budget categories" ON budget_categories
          FOR SELECT USING (true);
    END IF;
END $$;

-- 完了メッセージ
SELECT 'RLSポリシーの修正が完了しました' as message;
