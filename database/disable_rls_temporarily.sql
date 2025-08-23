-- RLSを一時的に無効化してテストするためのスクリプト
-- 注意: 本番環境では実行しないでください

-- 現在のRLSポリシーを確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'budget_categories', 'cost_entries');

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'budget_categories', 'cost_entries');

-- RLSを一時的に無効化（テスト用）
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries DISABLE ROW LEVEL SECURITY;

-- 無効化後の状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'budget_categories', 'cost_entries');

-- テスト用のプロジェクトデータを挿入（必要に応じて）
INSERT INTO projects (id, company_id, name, client_name, contract_amount, start_date, end_date, completion_method, progress_calculation_method, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'テストプロジェクトA', 'テストクライアントA', 10000000, '2024-01-01', '2024-12-31', 'percentage', 'cost_ratio', 'active', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM companies LIMIT 1), 'テストプロジェクトB', 'テストクライアントB', 15000000, '2024-02-01', '2024-11-30', 'percentage', 'work_ratio', 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- テスト用の予算カテゴリを挿入（必要に応じて）
INSERT INTO budget_categories (id, name, parent_id, level, sort_order, created_at)
VALUES 
  (gen_random_uuid(), 'テスト直接費', NULL, 1, 1, NOW()),
  (gen_random_uuid(), 'テスト間接費', NULL, 1, 2, NOW()),
  (gen_random_uuid(), 'テスト人件費', (SELECT id FROM budget_categories WHERE name = 'テスト直接費'), 2, 1, NOW())
ON CONFLICT DO NOTHING;

-- データが正しく取得できるかテスト
SELECT 'プロジェクト数' as info, COUNT(*) as count FROM projects
UNION ALL
SELECT '予算カテゴリ数', COUNT(*) FROM budget_categories
UNION ALL
SELECT '会社数', COUNT(*) FROM companies;

-- 注意: テスト完了後は以下のコマンドでRLSを再有効化してください
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
