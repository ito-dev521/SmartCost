-- system_fee_billingテーブルの削除
-- 注意: このテーブルは使用されていないため、安全に削除できます

-- テーブルが存在する場合のみ削除
DROP TABLE IF EXISTS system_fee_billing CASCADE;

-- 関連するインデックスも自動的に削除されます
-- 関連するトリガーも自動的に削除されます
-- 関連するRLSポリシーも自動的に削除されます

-- 削除完了メッセージ
SELECT 'system_fee_billingテーブルを削除しました' AS message;





