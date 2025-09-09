const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProjectProgressSchema() {
  try {
    console.log('🔍 project_progressテーブルのスキーマ確認開始...\n')
    
    // 1. テーブル構造の詳細確認
    console.log('📋 1. テーブル構造の詳細確認:')
    try {
      // システムテーブルからスキーマ情報を取得
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'project_progress' })
      
      if (error) {
        console.log('  ❌ スキーマ取得エラー:', error.message)
        
        // 代替方法：サンプルデータからカラム名を推測
        console.log('  📋 代替方法：サンプルデータからカラム名を推測')
        const { data: sampleData, error: sampleError } = await supabase
          .from('project_progress')
          .select('*')
          .limit(1)
        
        if (sampleError) {
          console.log('  ❌ サンプルデータ取得エラー:', sampleError.message)
        } else if (sampleData && sampleData.length > 0) {
          console.log('  📋 現在のカラム:')
          Object.keys(sampleData[0]).forEach(column => {
            console.log(`    - ${column}`)
          })
        }
      } else {
        console.log('  ✅ スキーマ情報取得成功')
        console.log('  📋 カラム一覧:', data)
      }
    } catch (error) {
      console.log('  ❌ スキーマ確認エラー:', error.message)
    }
    
    // 2. 既存データのcompany_id状況確認
    console.log('\n📋 2. 既存データのcompany_id状況確認:')
    try {
      const { data, error } = await supabase
        .from('project_progress')
        .select('id, project_id, company_id')
        .limit(10)
      
      if (error) {
        console.log('  ❌ データ取得エラー:', error.message)
        if (error.message.includes('company_id')) {
          console.log('  📋 company_idカラムが存在しないことが確認されました')
        }
      } else {
        console.log(`  📊 取得レコード数: ${data?.length || 0}件`)
        if (data && data.length > 0) {
          console.log('  📋 company_idの状況:')
          data.forEach((record, index) => {
            console.log(`    ${index + 1}. ID: ${record.id}`)
            console.log(`       プロジェクトID: ${record.project_id}`)
            console.log(`       会社ID: ${record.company_id || 'NULL'}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ データ確認エラー:', error.message)
    }
    
    // 3. プロジェクトテーブルとの関連確認
    console.log('\n📋 3. プロジェクトテーブルとの関連確認:')
    try {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, business_number, company_id')
        .limit(5)
      
      if (projectsError) {
        console.log('  ❌ プロジェクト取得エラー:', projectsError.message)
      } else {
        console.log(`  📊 プロジェクト数: ${projects?.length || 0}件`)
        if (projects && projects.length > 0) {
          console.log('  📋 プロジェクト一覧:')
          projects.forEach((project, index) => {
            console.log(`    ${index + 1}. ${project.business_number} - ${project.name}`)
            console.log(`       会社ID: ${project.company_id}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ プロジェクト確認エラー:', error.message)
    }
    
    // 4. 推奨される修正手順
    console.log('\n💡 4. 推奨される修正手順:')
    console.log('  📋 問題: project_progressテーブルにcompany_idカラムが存在しない')
    console.log('  📋 解決策:')
    console.log('    1. SupabaseダッシュボードでSQLエディタを開く')
    console.log('    2. database/add_company_id_to_project_progress.sqlを実行')
    console.log('    3. 既存データのcompany_idを更新')
    console.log('    4. RLSポリシーを更新')
    console.log('    5. 進捗管理機能をテスト')
    
    console.log('\n✅ スキーマ確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkProjectProgressSchema()
