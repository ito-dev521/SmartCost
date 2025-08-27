-- 予算科目データの状況を確認
-- 1. テーブル構造の確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'budget_categories' 
ORDER BY ordinal_position;

-- 2. 現在の予算科目データの確認
SELECT 
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at
FROM budget_categories 
ORDER BY level, sort_order;

-- 3. 階層構造の確認
WITH RECURSIVE category_tree AS (
    SELECT 
        id, 
        name, 
        level, 
        parent_id, 
        sort_order,
        0 as depth,
        ARRAY[name] as path
    FROM budget_categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT 
        c.id, 
        c.name, 
        c.level, 
        c.parent_id, 
        c.sort_order,
        ct.depth + 1,
        ct.path || c.name
    FROM budget_categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT 
    depth,
    REPEAT('  ', depth) || name as hierarchical_name,
    level,
    parent_id,
    sort_order
FROM category_tree
ORDER BY path;






