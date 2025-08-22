-- 建設原価管理システム データベーススキーマ
-- Supabase PostgreSQL用

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 会社・組織テーブル
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー・権限テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, manager, user, viewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロジェクト管理テーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  contract_amount DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  completion_method VARCHAR(20) DEFAULT 'completed', -- completed, percentage
  progress_calculation_method VARCHAR(20) DEFAULT 'cost_ratio', -- cost_ratio, work_ratio
  status VARCHAR(20) DEFAULT 'active', -- active, completed, suspended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予算科目テーブル
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  level INTEGER NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プロジェクト予算テーブル
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  planned_amount DECIMAL(15,2) NOT NULL,
  fiscal_year INTEGER,
  quarter INTEGER,
  month INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 原価エントリーテーブル
CREATE TABLE cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  entry_type VARCHAR(20) NOT NULL, -- direct, indirect
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 進捗管理テーブル
CREATE TABLE project_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  progress_rate DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  cumulative_cost DECIMAL(15,2),
  estimated_total_cost DECIMAL(15,2),
  revenue_recognition DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 資金管理・予測テーブル
CREATE TABLE cash_flow_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  prediction_date DATE NOT NULL,
  predicted_outflow DECIMAL(15,2) NOT NULL,
  predicted_inflow DECIMAL(15,2) NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  risk_level VARCHAR(10), -- low, medium, high
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255),
  payment_amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_type VARCHAR(50), -- 外注費, 材料費, 人件費等
  priority_score INTEGER, -- 1-10
  is_negotiable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI分析結果テーブル
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  prediction_type VARCHAR(50), -- budget_risk, schedule_delay, cost_overrun等
  prediction_value DECIMAL(15,2),
  confidence_score DECIMAL(3,2),
  explanation TEXT,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI学習データテーブル
CREATE TABLE historical_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type VARCHAR(100),
  project_scale VARCHAR(50),
  seasonal_factor VARCHAR(20),
  cost_pattern JSONB,
  timeline_pattern JSONB,
  risk_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アクセス権限テーブル
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) NOT NULL, -- read, write, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- インデックス作成
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_cost_entries_project_id ON cost_entries(project_id);
CREATE INDEX idx_cost_entries_entry_date ON cost_entries(entry_date);
CREATE INDEX idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX idx_project_progress_project_id ON project_progress(project_id);
CREATE INDEX idx_cash_flow_predictions_project_id ON cash_flow_predictions(project_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_project_id ON user_permissions(project_id);

-- 更新日時自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新日時トリガー
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) ポリシー
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の所属する会社のデータのみアクセス可能
CREATE POLICY "Users can view their company data" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM departments 
      WHERE id IN (
        SELECT department_id FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- プロジェクトは権限を持つユーザーのみアクセス可能
CREATE POLICY "Users can view projects they have access to" ON projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
    OR 
    company_id IN (
      SELECT company_id FROM departments 
      WHERE id IN (
        SELECT department_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- プロジェクト挿入権限（管理者・マネージャーのみ）
CREATE POLICY "Managers can create projects" ON projects
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM departments 
      WHERE id IN (
        SELECT department_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- プロジェクト更新権限
CREATE POLICY "Users can update projects with write permission" ON projects
  FOR UPDATE USING (
    id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid() AND permission_level IN ('write', 'admin')
    )
    OR 
    company_id IN (
      SELECT company_id FROM departments 
      WHERE id IN (
        SELECT department_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- 原価データアクセス権限
CREATE POLICY "Users can view cost entries for accessible projects" ON cost_entries
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cost entries with write permission" ON cost_entries
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid() AND permission_level IN ('write', 'admin')
    )
    AND created_by = auth.uid()
  );

-- 予算データアクセス権限
CREATE POLICY "Users can view budgets for accessible projects" ON project_budgets
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- 進捗データアクセス権限
CREATE POLICY "Users can view progress for accessible projects" ON project_progress
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- AI予測データアクセス権限
CREATE POLICY "Users can view AI predictions for accessible projects" ON ai_predictions
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- 資金管理データアクセス権限
CREATE POLICY "Users can view cash flow for accessible projects" ON cash_flow_predictions
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view payment schedule for accessible projects" ON payment_schedule
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- ユーザー権限管理（管理者のみ）
CREATE POLICY "Admins can manage user permissions" ON user_permissions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id IN (
        SELECT company_id FROM departments 
        WHERE id IN (
          SELECT department_id FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- 初期データ投入
-- デフォルト予算科目
INSERT INTO budget_categories (name, parent_id, level, sort_order) VALUES
  ('直接費', NULL, 1, 1),
  ('間接費', NULL, 1, 2),
  ('人件費', (SELECT id FROM budget_categories WHERE name = '直接費'), 2, 1),
  ('外注費', (SELECT id FROM budget_categories WHERE name = '直接費'), 2, 2),
  ('材料費', (SELECT id FROM budget_categories WHERE name = '直接費'), 2, 3),
  ('機械費', (SELECT id FROM budget_categories WHERE name = '直接費'), 2, 4),
  ('現場管理費', (SELECT id FROM budget_categories WHERE name = '間接費'), 2, 1),
  ('一般管理費', (SELECT id FROM budget_categories WHERE name = '間接費'), 2, 2);

-- デフォルト会社（デモ用）
INSERT INTO companies (name) VALUES ('サンプル建設コンサルタント株式会社');

-- デフォルト部署
INSERT INTO departments (company_id, name, parent_id) VALUES
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '本社', NULL),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '技術部', (SELECT id FROM departments WHERE name = '本社')),
  ((SELECT id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社'), '営業部', (SELECT id FROM departments WHERE name = '本社'));
