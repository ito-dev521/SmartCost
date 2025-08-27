-- クライアントテーブルの会社IDを修正
-- サンプル建設コンサルタント株式会社のIDを取得
DO $$
DECLARE
    target_company_id UUID;
BEGIN
    -- サンプル建設コンサルタント株式会社のIDを取得
    SELECT id INTO target_company_id FROM companies WHERE name = 'サンプル建設コンサルタント株式会社';
    
    IF target_company_id IS NOT NULL THEN
        -- 全クライアントの会社IDを更新
        UPDATE clients 
        SET company_id = target_company_id,
            updated_at = NOW()
        WHERE company_id != target_company_id;
        
        RAISE NOTICE 'クライアントの会社IDを % に更新しました', target_company_id;
    ELSE
        RAISE NOTICE 'サンプル建設コンサルタント株式会社が見つかりません';
    END IF;
END $$;

-- 更新結果を確認
SELECT 
    c.id,
    c.name,
    c.company_id,
    comp.name as company_name
FROM clients c
LEFT JOIN companies comp ON c.company_id = comp.id
ORDER BY c.name;
