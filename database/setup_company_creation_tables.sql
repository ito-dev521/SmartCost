-- 法人作成APIに必要なテーブルとフィールドを設定
-- このスクリプトを実行してから法人作成APIを使用してください

-- 1. companiesテーブルに必要なフィールドを追加
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. company_settingsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  caddon_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. company_settingsテーブルの更新トリガーを作成
CREATE OR REPLACE FUNCTION trg_update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_settings_updated_at ON company_settings;
CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_company_settings_updated_at();

-- 4. usersテーブルにcompany_idフィールドが存在しない場合は追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- 5. インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_contact_name ON companies(contact_name);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- 6. 既存のcompaniesテーブルにcompany_settingsレコードを作成
INSERT INTO company_settings (company_id, caddon_enabled)
SELECT id, true
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings cs WHERE cs.company_id = c.id
);

-- 7. テーブル構造の確認
-- \d companies
-- \d company_settings
-- \d users
