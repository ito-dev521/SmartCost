-- 委託費カテゴリを追加
-- 1. 委託費カテゴリを追加
INSERT INTO budget_categories (
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at
) VALUES (
    gen_random_uuid(), -- 新しいUUIDを生成
    '委託費',
    2, -- レベル2（人件費、現場管理費と同じレベル）
    NULL, -- 親カテゴリなし
    2, -- ソート順（人件費の後、外注費の前）
    NOW()
);

-- 2. 追加されたカテゴリを確認
SELECT 
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at
FROM budget_categories 
WHERE name = '委託費'
ORDER BY created_at DESC;

-- 3. 全カテゴリの現在の状況を確認
SELECT 
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at
FROM budget_categories 
ORDER BY level, sort_order, name;











