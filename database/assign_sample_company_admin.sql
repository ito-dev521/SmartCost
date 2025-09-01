-- サンプル会社の管理者として superadmin@example.com を割り当て
-- 冪等に実行できるようUPSERTで実装

WITH sample_company AS (
  SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社' LIMIT 1
), upsert_user AS (
  INSERT INTO users (email, name, role, company_id, is_active)
  SELECT 'superadmin@example.com', 'サンプル管理者', 'admin', (SELECT id FROM sample_company), true
  ON CONFLICT (email)
  DO UPDATE SET
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    is_active = true
  RETURNING id, company_id
)
INSERT INTO company_admins (company_id, user_id, role, permissions, is_active)
SELECT (SELECT id FROM sample_company), id, 'admin', NULL, true
FROM upsert_user
ON CONFLICT (company_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true;

-- 確認用
SELECT 'company_admin割当完了' AS message;



