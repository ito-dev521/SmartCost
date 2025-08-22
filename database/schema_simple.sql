-- 制約なしでまずテーブルを作成するアプローチ
-- ステップ1: 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ステップ2: すべてのテーブルを制約なしで作成
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- 制約なし
  name VARCHAR(255) NOT NULL,
  parent_id UUID, -- 制約なし
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID, -- 制約なし
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  company_id UUID, -- 制約なし
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE company_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- 制約なし
  user_id UUID, -- 制約なし
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- 制約なし
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  industry VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID, -- 制約なし
  client_id UUID, -- 制約なし
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

-- ステップ3: データを挿入
INSERT INTO companies (name) VALUES
  ('サンプル建設コンサルタント株式会社');

INSERT INTO departments (company_id, name, parent_id) VALUES
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '本社', NULL),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '技術部', (SELECT id FROM departments WHERE name = '本社')),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '営業部', (SELECT id FROM departments WHERE name = '本社'));

INSERT INTO super_admins (email, name, password_hash) VALUES
  ('superadmin@example.com', 'スーパー管理者', '$2b$10$dummy.hash.for.demo.purposes.only');

-- ステップ4: インデックス作成
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);

-- ステップ5: 関数とトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ステップ6: RLS有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can access everything" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ステップ7: 外部キー制約を後から追加（オプション）
-- 必要に応じて以下の制約を追加してください
/*
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
*/

-- 完了メッセージ
SELECT '制約なしでの構築が完了しました' as message;
