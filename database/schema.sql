-- 最小限のスキーマ（スーパー管理者機能のみ）
-- 最もシンプルな構成で動作確認用

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 会社テーブル
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スーパー管理者テーブル
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 部門テーブル
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name VARCHAR(255) NOT NULL,
  parent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー・権限テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  company_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 法人管理者テーブル
CREATE TABLE company_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- クライアント管理テーブル
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  industry VARCHAR(100),
  notes TEXT,
  -- 入金サイクル関連フィールド
  payment_cycle_type VARCHAR(50) DEFAULT 'month_end', -- 'month_end', 'specific_date'
  payment_cycle_closing_day INTEGER DEFAULT 31, -- 締め日（1-31）
  payment_cycle_payment_month_offset INTEGER DEFAULT 1, -- 支払い月オフセット（0=当月、1=翌月）
  payment_cycle_payment_day INTEGER DEFAULT 31, -- 支払い日（1-31）
  payment_cycle_description VARCHAR(255), -- 入金サイクルの説明（例：月末締め翌月末払い）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロジェクト管理テーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  client_id UUID,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  contract_amount DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  completion_method VARCHAR(20) DEFAULT 'completed',
  progress_calculation_method VARCHAR(20) DEFAULT 'cost_ratio',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予算科目テーブル
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID,
  level INTEGER NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_company_admins_company_id ON company_admins(company_id);
CREATE INDEX idx_company_admins_user_id ON company_admins(user_id);

-- 更新日時自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_admins_updated_at
    BEFORE UPDATE ON company_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 外部キー制約追加
ALTER TABLE departments ADD CONSTRAINT fk_departments_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE departments ADD CONSTRAINT fk_departments_parent_id
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_department_id
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE company_admins ADD CONSTRAINT fk_company_admins_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE company_admins ADD CONSTRAINT fk_company_admins_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE clients ADD CONSTRAINT fk_clients_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE projects ADD CONSTRAINT fk_projects_company_id
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE projects ADD CONSTRAINT fk_projects_client_id
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE budget_categories ADD CONSTRAINT fk_budget_categories_parent_id
    FOREIGN KEY (parent_id) REFERENCES budget_categories(id) ON DELETE SET NULL;

-- RLS有効化とポリシー作成
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

-- プロジェクトのRLSポリシー
CREATE POLICY "Users can view projects in their company" ON projects
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

CREATE POLICY "Users can insert projects in their company" ON projects
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

CREATE POLICY "Users can update projects in their company" ON projects
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

CREATE POLICY "Users can delete projects in their company" ON projects
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

CREATE POLICY "Super admins can access everything" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- 初期データ挿入
INSERT INTO companies (name) VALUES
  ('サンプル建設コンサルタント株式会社');



INSERT INTO departments (company_id, name, parent_id) VALUES
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '本社', NULL),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '技術部', (SELECT id FROM departments WHERE name = '本社')),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '営業部', (SELECT id FROM departments WHERE name = '本社'));

INSERT INTO super_admins (email, name, password_hash) VALUES
  ('genka_ad@ii-stylelab.com', 'スーパー管理者', '$2b$10$dummy.hash.for.demo.purposes.only');



-- 完了メッセージ
SELECT '最小限のスキーマ作成が完了しました' as message;
