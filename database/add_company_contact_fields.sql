-- companiesテーブルに連絡先カラムを追加
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 既存レコードの整合性: NULL許容のため特別な移行は不要

-- インデックス（検索想定のあるカラムに軽いインデックス）
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_contact_name ON companies(contact_name);


