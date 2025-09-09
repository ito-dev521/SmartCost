const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestCompanyDepartments() {
  try {
    console.log('🔍 テスト会社10用の部署を作成開始...')
    
    // テスト会社10のID
    const testCompanyId = '433f167b-e456-42e9-8dcd-9bcbe96d7678'
    
    // テスト会社10用の部署データ
    const departments = [
      '本社',
      '営業部',
      '技術部',
      '開発部',
      '総務部'
    ]
    
    console.log('📋 テスト会社10用の部署を作成中...')
    
    for (const departmentName of departments) {
      console.log(`🔄 部署作成: ${departmentName}`)
      
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: departmentName,
          company_id: testCompanyId
        })
        .select()
      
      if (error) {
        console.error(`❌ 部署作成エラー (${departmentName}):`, error)
      } else {
        console.log(`✅ 部署作成完了: ${departmentName}`)
      }
    }
    
    console.log('✅ テスト会社10用の部署作成完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

createTestCompanyDepartments()
