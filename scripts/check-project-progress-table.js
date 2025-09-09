const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProjectProgressTable() {
  try {
    console.log('🔍 project_progressテーブルの構造確認開始...\n')
    
    // 1. テーブル構造の確認
    console.log('📋 1. テーブル構造の確認:')
    try {
      const { data, error } = await supabase
        .from('project_progress')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log('  ❌ テーブルアクセスエラー:', error.message)
        console.log('  📋 エラー詳細:', {
          code: error.code,
          details: error.details,
          hint: error.hint
        })
      } else {
        console.log('  ✅ テーブルアクセス成功')
        if (data && data.length > 0) {
          console.log('  📋 サンプルデータの構造:')
          const sample = data[0]
          Object.keys(sample).forEach(key => {
            console.log(`    - ${key}: ${typeof sample[key]} (${sample[key]})`)
          })
        } else {
          console.log('  📋 テーブルは空です')
        }
      }
    } catch (error) {
      console.log('  ❌ テーブル確認エラー:', error.message)
    }
    
    // 2. 既存データの確認
    console.log('\n📋 2. 既存データの確認:')
    try {
      const { data, error } = await supabase
        .from('project_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        console.log('  ❌ データ取得エラー:', error.message)
      } else {
        console.log(`  📊 総レコード数: ${data?.length || 0}件`)
        if (data && data.length > 0) {
          console.log('  📋 最新データ:')
          data.forEach((record, index) => {
            console.log(`    ${index + 1}. プロジェクトID: ${record.project_id}`)
            console.log(`       進捗率: ${record.progress_rate}%`)
            console.log(`       記録日: ${record.progress_date}`)
            console.log(`       会社ID: ${record.company_id}`)
            console.log(`       作成日: ${record.created_at}`)
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
        .select('id, name, business_number, status, company_id')
        .limit(5)
      
      if (projectsError) {
        console.log('  ❌ プロジェクト取得エラー:', projectsError.message)
      } else {
        console.log(`  📊 プロジェクト数: ${projects?.length || 0}件`)
        if (projects && projects.length > 0) {
          console.log('  📋 プロジェクト一覧:')
          projects.forEach((project, index) => {
            console.log(`    ${index + 1}. ${project.business_number} - ${project.name}`)
            console.log(`       ステータス: ${project.status}`)
            console.log(`       会社ID: ${project.company_id}`)
          })
        }
      }
    } catch (error) {
      console.log('  ❌ プロジェクト確認エラー:', error.message)
    }
    
    // 4. テスト用の進捗データ挿入
    console.log('\n📋 4. テスト用の進捗データ挿入:')
    try {
      // 最初のプロジェクトを取得
      const { data: firstProject, error: projectError } = await supabase
        .from('projects')
        .select('id, company_id')
        .limit(1)
        .single()
      
      if (projectError || !firstProject) {
        console.log('  ❌ テスト用プロジェクト取得エラー:', projectError?.message)
      } else {
        console.log('  📋 テスト用プロジェクト:', firstProject)
        
        const testData = {
          project_id: firstProject.id,
          progress_rate: 50,
          progress_date: new Date().toISOString().split('T')[0],
          notes: 'テスト用進捗データ',
          company_id: firstProject.company_id,
          created_by: 'test-user-id',
          created_at: new Date().toISOString()
        }
        
        console.log('  📤 挿入データ:', testData)
        
        const { data, error: insertError } = await supabase
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
          console.log('  ✅ 挿入成功:', insertData)
          
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
    
    console.log('\n✅ project_progressテーブル確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkProjectProgressTable()
