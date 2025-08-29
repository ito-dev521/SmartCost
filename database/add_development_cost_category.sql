-- 開発費カテゴリを追加
-- 1. 開発費カテゴリを追加
INSERT INTO budget_categories (
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- 新しいUUIDを生成
    '開発費',
    2, -- レベル2（人件費、現場管理費と同じレベル）
    NULL, -- 親カテゴリなし
    3, -- ソート順（材料費の前）
    NOW(),
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
WHERE name = '開発費'
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









