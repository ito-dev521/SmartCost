-- スーパー管理者状態確認
SELECT
    id,
    email,
    name,
    is_active,
    created_at
FROM super_admins
ORDER BY created_at DESC;

-- 現在のユーザー確認（デバッグ用）
-- 必要に応じて以下のクエリを実行して現在のユーザーを確認
/*
SELECT
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
*/









