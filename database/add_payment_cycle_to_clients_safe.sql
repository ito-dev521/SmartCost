-- clientsテーブルに入金サイクル関連フィールドを安全に追加
-- 既存のテーブル構造を確認してから必要なカラムのみを追加

-- 1. テーブルの存在確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        RAISE EXCEPTION 'clientsテーブルが存在しません';
    END IF;
END $$;

-- 2. 各カラムの存在確認と追加
DO $$
BEGIN
    -- payment_cycle_typeカラムの追加
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_type') THEN
        ALTER TABLE clients ADD COLUMN payment_cycle_type VARCHAR(50) DEFAULT 'month_end';
        RAISE NOTICE 'payment_cycle_typeカラムを追加しました';
    ELSE
        RAISE NOTICE 'payment_cycle_typeカラムは既に存在します';
    END IF;

    -- payment_cycle_closing_dayカラムの追加
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_closing_day') THEN
        ALTER TABLE clients ADD COLUMN payment_cycle_closing_day INTEGER DEFAULT 31;
        RAISE NOTICE 'payment_cycle_closing_dayカラムを追加しました';
    ELSE
        RAISE NOTICE 'payment_cycle_closing_dayカラムは既に存在します';
    END IF;

    -- payment_cycle_payment_month_offsetカラムの追加
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_month_offset') THEN
        ALTER TABLE clients ADD COLUMN payment_cycle_payment_month_offset INTEGER DEFAULT 1;
        RAISE NOTICE 'payment_cycle_payment_month_offsetカラムを追加しました';
    ELSE
        RAISE NOTICE 'payment_cycle_payment_month_offsetカラムは既に存在します';
    END IF;

    -- payment_cycle_payment_dayカラムの追加
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_day') THEN
        ALTER TABLE clients ADD COLUMN payment_cycle_payment_day INTEGER DEFAULT 31;
        RAISE NOTICE 'payment_cycle_payment_dayカラムを追加しました';
    ELSE
        RAISE NOTICE 'payment_cycle_payment_dayカラムは既に存在します';
    END IF;

    -- payment_cycle_descriptionカラムの追加
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_description') THEN
        ALTER TABLE clients ADD COLUMN payment_cycle_description VARCHAR(255);
        RAISE NOTICE 'payment_cycle_descriptionカラムを追加しました';
    ELSE
        RAISE NOTICE 'payment_cycle_descriptionカラムは既に存在します';
    END IF;
END $$;

-- 3. 既存のレコードにデフォルト値を設定（NULLの場合のみ）
UPDATE clients 
SET 
  payment_cycle_type = 'month_end',
  payment_cycle_closing_day = 31,
  payment_cycle_payment_month_offset = 1,
  payment_cycle_payment_day = 31,
  payment_cycle_description = '月末締め翌月末払い'
WHERE payment_cycle_type IS NULL;

-- 4. コメントを追加
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_type') THEN
        COMMENT ON COLUMN clients.payment_cycle_type IS '入金サイクルタイプ（month_end: 月末締め, specific_date: 特定日締め）';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_closing_day') THEN
        COMMENT ON COLUMN clients.payment_cycle_closing_day IS '締め日（1-31）';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_month_offset') THEN
        COMMENT ON COLUMN clients.payment_cycle_payment_month_offset IS '支払い月オフセット（0: 当月, 1: 翌月, 2: 2ヶ月後）';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_payment_day') THEN
        COMMENT ON COLUMN clients.payment_cycle_payment_day IS '支払い日（1-31）';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_cycle_description') THEN
        COMMENT ON COLUMN clients.payment_cycle_description IS '入金サイクルの説明（例：月末締め翌月末払い）';
    END IF;
END $$;

-- 5. インデックスを作成（既存のインデックスがある場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_payment_cycle_type') THEN
        CREATE INDEX idx_clients_payment_cycle_type ON clients(payment_cycle_type);
        RAISE NOTICE 'idx_clients_payment_cycle_typeインデックスを作成しました';
    ELSE
        RAISE NOTICE 'idx_clients_payment_cycle_typeインデックスは既に存在します';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_payment_cycle_closing_day') THEN
        CREATE INDEX idx_clients_payment_cycle_closing_day ON clients(payment_cycle_closing_day);
        RAISE NOTICE 'idx_clients_payment_cycle_closing_dayインデックスを作成しました';
    ELSE
        RAISE NOTICE 'idx_clients_payment_cycle_closing_dayインデックスは既に存在します';
    END IF;
END $$;

-- 6. 完了メッセージ
SELECT '入金サイクル関連フィールドの追加が完了しました' as message;


