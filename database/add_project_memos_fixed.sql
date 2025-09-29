-- プロジェクトメモテーブルを追加（修正版）

-- プロジェクトメモテーブル
CREATE TABLE IF NOT EXISTS project_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_by_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_project_memos_project_id ON project_memos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memos_created_at ON project_memos(created_at);

-- 外部キー制約追加（存在チェック付き）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_project_memos_project_id'
        AND table_name = 'project_memos'
    ) THEN
        ALTER TABLE project_memos
        ADD CONSTRAINT fk_project_memos_project_id
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 更新日時自動更新トリガー（存在チェック付き）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_project_memos_updated_at'
        AND event_object_table = 'project_memos'
    ) THEN
        CREATE TRIGGER update_project_memos_updated_at
            BEFORE UPDATE ON project_memos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS有効化
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_memos') THEN
        ALTER TABLE project_memos ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLSポリシー作成（存在チェック付き）
DO $$
BEGIN
    -- SELECT ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_memos'
        AND policyname = 'Users can view project memos in their company'
    ) THEN
        CREATE POLICY "Users can view project memos in their company" ON project_memos
          FOR SELECT USING (
            project_id IN (
              SELECT id FROM projects
              WHERE company_id IN (
                SELECT company_id FROM users
                WHERE id = auth.uid()
              )
            ) OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            ) OR
            project_id IN (
              SELECT id FROM projects
              WHERE company_id IN (
                SELECT id FROM companies
                WHERE name = 'サンプル建設コンサルタント株式会社'
              )
            )
          );
    END IF;

    -- INSERT ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_memos'
        AND policyname = 'Users can insert project memos in their company'
    ) THEN
        CREATE POLICY "Users can insert project memos in their company" ON project_memos
          FOR INSERT WITH CHECK (
            project_id IN (
              SELECT id FROM projects
              WHERE company_id IN (
                SELECT company_id FROM users
                WHERE id = auth.uid()
              )
            ) OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            )
          );
    END IF;

    -- UPDATE ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_memos'
        AND policyname = 'Users can update their own project memos'
    ) THEN
        CREATE POLICY "Users can update their own project memos" ON project_memos
          FOR UPDATE USING (
            created_by_email = auth.jwt() ->> 'email' OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            )
          );
    END IF;

    -- DELETE ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'project_memos'
        AND policyname = 'Users can delete their own project memos'
    ) THEN
        CREATE POLICY "Users can delete their own project memos" ON project_memos
          FOR DELETE USING (
            created_by_email = auth.jwt() ->> 'email' OR
            EXISTS (
              SELECT 1 FROM super_admins
              WHERE email = auth.jwt() ->> 'email'
              AND is_active = true
            )
          );
    END IF;
END $$;

-- 完了メッセージ
SELECT 'プロジェクトメモテーブルが追加されました' as message;