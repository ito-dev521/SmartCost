-- 必要なテーブルの存在確認
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('projects', 'clients', 'caddon_billing', 'fiscal_info') THEN '✅ 必要'
    ELSE '❌ 不要'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'clients', 'caddon_billing', 'fiscal_info')
ORDER BY table_name;

-- 各テーブルのレコード数確認
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'caddon_billing' as table_name, COUNT(*) as record_count FROM caddon_billing
UNION ALL
SELECT 'fiscal_info' as table_name, COUNT(*) as record_count FROM fiscal_info;

-- サンプルデータ確認
SELECT 'projects' as table_name, id, name, client_name, contract_amount FROM projects LIMIT 3;
SELECT 'clients' as table_name, id, name, payment_cycle_type FROM clients LIMIT 3;
SELECT 'caddon_billing' as table_name, id, project_id, billing_month, total_amount FROM caddon_billing LIMIT 3;
SELECT 'fiscal_info' as table_name, id, fiscal_year, settlement_month FROM fiscal_info LIMIT 3;




