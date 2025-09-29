-- 業務番号の重複データをクリーンアップするSQL

-- 重複している業務番号を確認
SELECT business_number, COUNT(*) as count,
       STRING_AGG(name, ', ') as project_names
FROM projects
WHERE business_number IS NOT NULL
  AND business_number != ''
GROUP BY business_number
HAVING COUNT(*) > 1;

-- 重複データの詳細を確認
SELECT id, name, business_number, created_at
FROM projects
WHERE business_number IN (
  SELECT business_number
  FROM projects
  WHERE business_number IS NOT NULL
    AND business_number != ''
  GROUP BY business_number
  HAVING COUNT(*) > 1
)
ORDER BY business_number, created_at;

-- 重複データの修正案：
-- 1. 古い方のプロジェクトの業務番号をNULLにする
-- 2. または新しい業務番号を生成する

-- 実際のクリーンアップは手動で実行してください
-- 例: UPDATE projects SET business_number = NULL WHERE id = '重複するプロジェクトのID';