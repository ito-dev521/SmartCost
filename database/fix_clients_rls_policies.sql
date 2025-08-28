-- クライアントテーブルのRLSポリシーを修正
-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can delete clients in their company" ON clients;

-- クライアント閲覧ポリシー
CREATE POLICY "Users can view clients in their company" ON clients
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    ) OR
    company_id IN (
      SELECT id FROM companies
      WHERE name = 'サンプル建設コンサルタント株式会社'
    )
  );

-- クライアント作成ポリシー
CREATE POLICY "Users can insert clients in their company" ON clients
  FOR INSERT WITH CHECK (
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

-- クライアント更新ポリシー
CREATE POLICY "Users can update clients in their company" ON clients
  FOR UPDATE USING (
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

-- クライアント削除ポリシー
CREATE POLICY "Users can delete clients in their company" ON clients
  FOR DELETE USING (
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

-- 完了メッセージ
SELECT 'クライアントテーブルのRLSポリシーを修正しました' AS message;

