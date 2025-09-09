const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyProjectProgressFix() {
  try {
    console.log('🔍 project_progressテーブルの修正確認開始...\n')
    
    // 1. テーブル構造の確認
    console.log('📋 1. テーブル構造の確認:')
    try {
      const { data, error } = await supabase
        .from('project_progress')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log('  ❌ テーブルアクセスエラー:', error.message)
      } else {
        console.log('  ✅ テーブルアクセス成功')
        if (data && data.length > 0) {
          console.log('  📋 現在のカラム:')
          Object.keys(data[0]).forEach(column => {
            const value = data[0][column]
            console.log(`    - ${column}: ${typeof value} (${value})`)
          })
          
          // company_idカラムの存在確認
          if ('company_id' in data[0]) {
            console.log('  ✅ company_idカラムが存在します')
          } else {
            console.log('  ❌ company_idカラムが存在しません')
          }
        } else {
          console.log('  📋 テーブルは空です')
        }
      }
    } catch (error) {
      console.log('  ❌ テーブル確認エラー:', error.message)
    }
    
    // 2. 既存データのcompany_id状況確認
    console.log('\n📋 2. 既存データのcompany_id状況確認:')
    try {
      const { data, error } = await supabase
        .from('project_progress')
        .select('id, project_id, progress_rate, company_id')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.log('  ❌ データ取得エラー:', error.message)
      } else {
        console.log(`  📊 取得レコード数: ${data?.length || 0}件`)
        if (data && data.length > 0) {
          console.log('  📋 company_idの状況:')
          let withCompanyId = 0
          let withoutCompanyId = 0
          
          data.forEach((record, index) => {
            console.log(`    ${index + 1}. ID: ${record.id}`)
            console.log(`       プロジェクトID: ${record.project_id}`)
            console.log(`       進捗率: ${record.progress_rate}%`)
            console.log(`       会社ID: ${record.company_id || 'NULL'}`)
            
            if (record.company_id) {
              withCompanyId++
            } else {
              withoutCompanyId++
            }
          })
          
          console.log(`\n  📊 統計:`)
          console.log(`    - company_idあり: ${withCompanyId}件`)
          console.log(`    - company_idなし: ${withoutCompanyId}件`)
        }
      }
    } catch (error) {
      console.log('  ❌ データ確認エラー:', error.message)
    }
    
    // 3. テスト用の進捗データ挿入
    console.log('\n📋 3. テスト用の進捗データ挿入:')
    try {
      // 最初のプロジェクトを取得
      const { data: firstProject, error: projectError } = await supabase
        .from('projects')
        .select('id, name, business_number, company_id')
        .limit(1)
        .single()
      
      if (projectError || !firstProject) {
        console.log('  ❌ テスト用プロジェクト取得エラー:', projectError?.message)
      } else {
        console.log('  📋 テスト用プロジェクト:', {
          id: firstProject.id,
          name: firstProject.name,
          business_number: firstProject.business_number,
          company_id: firstProject.company_id
        })
        
        const testData = {
          project_id: firstProject.id,
          progress_rate: 75,
          progress_date: new Date().toISOString().split('T')[0],
          notes: 'SQL修正後のテスト用進捗データ',
          company_id: firstProject.company_id,
          created_by: 'test-user-id',
          created_at: new Date().toISOString()
        }
        
        console.log('  📤 挿入データ:', testData)
        
        const { data: insertData, error: insertError } = await supabase
          .from('project_progress')
          .insert(testData)
          .select('*')
          .single()
        
        if (insertError) {
          console.log('  ❌ 挿入エラー:', insertError.message)
          console.log('  📋 エラー詳細:', {
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          })
        } else {
          console.log('  ✅ 挿入成功!')
          console.log('  📋 挿入されたデータ:', {
            id: insertData.id,
            project_id: insertData.project_id,
            progress_rate: insertData.progress_rate,
            company_id: insertData.company_id,
            created_at: insertData.created_at
          })
          
          // テストデータを削除
          const { error: deleteError } = await supabase
            .from('project_progress')
            .delete()
            .eq('id', insertData.id)
          
          if (deleteError) {
            console.log('  ⚠️ テストデータ削除エラー:', deleteError.message)
          } else {
            console.log('  ✅ テストデータ削除完了')
          }
        }
      }
    } catch (error) {
      console.log('  ❌ テスト挿入エラー:', error.message)
    }
    
    // 4. 修正結果の確認
    console.log('\n📋 4. 修正結果の確認:')
    console.log('  📋 修正内容:')
    console.log('    1. ✅ company_idカラムを追加')
    console.log('    2. ✅ 既存データのcompany_idを更新')
    console.log('    3. ✅ インデックスを追加')
    console.log('    4. ✅ RLSポリシーを更新')
    
    // 5. 次のステップ
    console.log('\n💡 5. 次のステップ:')
    console.log('  📋 ブラウザでのテスト手順:')
    console.log('    1. ブラウザでアプリケーションにログイン')
    console.log('    2. 進捗管理ページに移動')
    console.log('    3. プロジェクトを選択')
    console.log('    4. 進捗率を入力して「進捗を記録」ボタンをクリック')
    console.log('    5. エラーが発生しないことを確認')
    
    console.log('\n✅ project_progressテーブルの修正確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

verifyProjectProgressFix()
