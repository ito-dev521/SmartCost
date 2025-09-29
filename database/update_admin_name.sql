-- スーパー管理者の名前を実名に変更し、既存メモも更新

-- スーパー管理者の名前を変更
UPDATE super_admins
SET name = 'おら社長だぞ'
WHERE email = 'genka_ad@ii-stylelab.com';

-- 既存メモの作成者名も更新
UPDATE project_memos
SET created_by_name = 'おら社長だぞ'
WHERE created_by_email = 'genka_ad@ii-stylelab.com'
AND created_by_name = 'スーパー管理者';

-- 確認用クエリ
SELECT email, name FROM super_admins WHERE email = 'genka_ad@ii-stylelab.com';
SELECT created_by_name, created_by_email, content FROM project_memos WHERE created_by_email = 'genka_ad@ii-stylelab.com';

-- 完了メッセージ
SELECT '管理者名とメモの作成者名を更新しました' as message;