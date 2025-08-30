-- CADDONシステムの重複データを整理するSQLスクリプト
-- このスクリプトは、CADDONシステムのプロジェクトが重複している場合に、
-- 最古のプロジェクト（元からある方）に業務番号C001を設定し、
-- 重複するプロジェクトを削除します

-- 1. 現在のCADDONシステムのプロジェクトを確認
SELECT 
    id,
    name,
    business_number,
    client_name,
    contract_amount,
    created_at,
    updated_at
FROM projects 
WHERE name ILIKE '%CADDON%' 
   OR business_number ILIKE 'C%'
ORDER BY created_at ASC;

-- 2. 最古のCADDONシステムプロジェクトに業務番号C001を設定
-- （このIDは上記のクエリ結果から取得してください）
-- UPDATE projects 
-- SET business_number = 'C001'
-- WHERE id = '最古のプロジェクトのID';

-- 3. 重複するCADDONシステムプロジェクトを削除
-- （このIDは上記のクエリ結果から取得してください）
-- DELETE FROM projects 
-- WHERE id IN ('削除するプロジェクトのID1', '削除するプロジェクトのID2');

-- 4. 整理後の確認
SELECT 
    id,
    name,
    business_number,
    client_name,
    contract_amount,
    created_at,
    updated_at
FROM projects 
WHERE name ILIKE '%CADDON%' 
   OR business_number ILIKE 'C%'
ORDER BY created_at ASC;

-- 注意: このスクリプトを実行する前に、必ずバックアップを取得してください
-- また、削除するプロジェクトのIDを確認してから実行してください
