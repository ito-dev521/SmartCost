-- bank_balance_historyテーブルのユニーク制約を修正
-- 問題: 現在の制約は fiscal_year + balance_date の組み合わせでユニーク
-- 解決: company_id + fiscal_year + balance_date の組み合わせでユニークに変更

-- 1. 既存のユニーク制約を削除
ALTER TABLE bank_balance_history 
DROP CONSTRAINT IF EXISTS bank_balance_history_fiscal_year_balance_date_key;

-- 2. 新しいユニーク制約を追加（company_idを含む）
ALTER TABLE bank_balance_history 
ADD CONSTRAINT bank_balance_history_company_fiscal_balance_unique 
UNIQUE (company_id, fiscal_year, balance_date);

-- 3. 制約の確認
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'bank_balance_history'::regclass 
AND contype = 'u';

-- 修正完了メッセージ
SELECT 'bank_balance_historyテーブルのユニーク制約が正常に修正されました' as message;
