const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixProjectCompanyIds() {
  console.log('🔧 プロジェクトの会社ID修正開始...')
  
  try {
    // 会社IDがnullのプロジェクトを取得
    const { data: nullProjects, error: nullError } = await supabase
      .from('projects')
      .select('id, name, business_number, company_id')
      .is('company_id', null)
    
    if (nullError) {
      console.error('❌ nullプロジェクト取得エラー:', nullError)
      return
    }
    
    console.log(`📋 会社IDがnullのプロジェクト: ${nullProjects?.length || 0}件`)
    nullProjects?.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
    })
    
    // デフォルトの会社ID（サンプル建設コンサルタント株式会社）
    const defaultCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    if (nullProjects && nullProjects.length > 0) {
      console.log(`\n🔧 プロジェクトの会社IDを ${defaultCompanyId} に設定します...`)
      
      const { data: updatedProjects, error: updateError } = await supabase
        .from('projects')
        .update({ company_id: defaultCompanyId })
        .is('company_id', null)
        .select('id, name, business_number, company_id')
      
      if (updateError) {
        console.error('❌ プロジェクト更新エラー:', updateError)
        return
      }
      
      console.log('✅ 更新されたプロジェクト:')
      updatedProjects?.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name} (会社ID: ${project.company_id})`)
      })
      
      console.log(`\n🎉 ${updatedProjects?.length || 0}件のプロジェクトの会社IDを修正しました`)
    } else {
      console.log('✅ 会社IDがnullのプロジェクトはありません')
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

fixProjectCompanyIds()
