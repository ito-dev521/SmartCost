-- bank_balance_historyテーブルの重複ポリシーをクリーンアップ

-- 古いポリシーを削除
DROP POLICY IF EXISTS "admin_access_bank_balance_history" ON bank_balance_history;

-- 確認用クエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'bank_balance_history';
