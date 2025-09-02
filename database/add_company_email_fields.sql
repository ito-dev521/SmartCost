-- companiesテーブルに法人作成APIで必要なフィールドを追加
-- 法人作成時のメールアドレス送信機能に対応

-- 既存のcompaniesテーブルにフィールドを追加
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT;

-- emailフィールドに一意制約を追加（重複チェック用）
-- 注意: 既存データがある場合は、重複がないことを確認してから実行してください
-- ALTER TABLE companies ADD CONSTRAINT companies_email_unique UNIQUE (email);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_contact_name ON companies(contact_name);

-- 既存のcompaniesテーブルの構造を確認
-- \d companies
