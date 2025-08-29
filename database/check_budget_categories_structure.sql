-- budget_categoriesテーブルの構造を確認
-- 1. テーブル構造の詳細確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'budget_categories' 
ORDER BY ordinal_position;

-- 2. 既存のカテゴリデータを確認
SELECT 
    id,
    name,
    level,
    parent_id,
    sort_order,
    created_at
FROM budget_categories 
ORDER BY level, sort_order, name;









