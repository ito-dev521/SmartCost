-- CADDON請求テーブルに初期設定料フィールドを追加
ALTER TABLE caddon_billing 
ADD COLUMN IF NOT EXISTS initial_setup_fee DECIMAL(10,2) DEFAULT 0;

-- 初期設定料フィールドのコメントを追加
COMMENT ON COLUMN caddon_billing.initial_setup_fee IS '初期設定料（円）';

-- 既存のレコードの初期設定料を0に設定
UPDATE caddon_billing 
SET initial_setup_fee = 0 
WHERE initial_setup_fee IS NULL;

-- 初期設定料フィールドをNOT NULLに設定
ALTER TABLE caddon_billing 
ALTER COLUMN initial_setup_fee SET NOT NULL;

-- サポート料フィールドを任意項目に変更
ALTER TABLE caddon_billing 
ALTER COLUMN support_fee DROP NOT NULL;

-- サポート料フィールドにデフォルト値を設定
ALTER TABLE caddon_billing 
ALTER COLUMN support_fee SET DEFAULT 0;

-- 既存のレコードのサポート料がNULLの場合は0に設定
UPDATE caddon_billing 
SET support_fee = 0 
WHERE support_fee IS NULL;

SELECT 'CADDON請求テーブルに初期設定料フィールドを追加し、サポート料を任意項目に変更しました' AS message;


