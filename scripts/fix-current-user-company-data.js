const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixCurrentUserCompanyData() {
  try {
    console.log('🔍 現在のユーザーの会社データ修正開始...')
    
    // 現在のユーザー（ito.dev@ii-stylelab.com）の会社IDを取得
    const currentUserEmail = 'ito.dev@ii-stylelab.com'
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, company_id, name')
      .eq('email', currentUserEmail)
      .single()
    
    if (userError || !currentUser) {
      console.error('❌ 現在のユーザーが見つかりません:', userError)
      return
    }
    
    console.log('👤 現在のユーザー:', {
      email: currentUserEmail,
      name: currentUser.name,
      company_id: currentUser.company_id
    })
    
    if (!currentUser.company_id) {
      console.error('❌ 現在のユーザーの会社IDが設定されていません')
      return
    }
    
    // プロジェクトテーブルの会社IDを更新
    console.log('📋 プロジェクトテーブルの会社IDを更新中...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, company_id')
    
    if (projectsError) {
      console.error('❌ プロジェクト取得エラー:', projectsError)
      return
    }
    
    console.log(`📊 プロジェクト総数: ${projects.length}件`)
    
    for (const project of projects) {
      if (project.company_id !== currentUser.company_id) {
        console.log(`🔄 プロジェクト更新: ${project.business_number} - ${project.name}`)
        console.log(`   旧会社ID: ${project.company_id}`)
        console.log(`   新会社ID: ${currentUser.company_id}`)
        
        const { error: updateError } = await supabase
          .from('projects')
          .update({ company_id: currentUser.company_id })
          .eq('id', project.id)
        
        if (updateError) {
          console.error(`❌ プロジェクト更新エラー (${project.business_number}):`, updateError)
        } else {
          console.log(`✅ プロジェクト更新完了: ${project.business_number}`)
        }
      }
    }
    
    // 予算科目テーブルの会社IDを更新
    console.log('📋 予算科目テーブルの会社IDを更新中...')
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('id, name, level, company_id')
    
    if (categoriesError) {
      console.error('❌ 予算科目取得エラー:', categoriesError)
      return
    }
    
    console.log(`📊 予算科目総数: ${categories.length}件`)
    
    for (const category of categories) {
      if (category.company_id !== currentUser.company_id) {
        console.log(`🔄 予算科目更新: ${category.name} (レベル${category.level})`)
        console.log(`   旧会社ID: ${category.company_id}`)
        console.log(`   新会社ID: ${currentUser.company_id}`)
        
        const { error: updateError } = await supabase
          .from('budget_categories')
          .update({ company_id: currentUser.company_id })
          .eq('id', category.id)
        
        if (updateError) {
          console.error(`❌ 予算科目更新エラー (${category.name}):`, updateError)
        } else {
          console.log(`✅ 予算科目更新完了: ${category.name}`)
        }
      }
    }
    
    console.log('✅ 現在のユーザーの会社データ修正完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

fixCurrentUserCompanyData()
