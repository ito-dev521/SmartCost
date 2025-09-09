const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCurrentUserData() {
  try {
    // 現在のユーザーの会社IDを取得
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, company_id, name')
      .eq('email', 'ito.dev@ii-stylelab.com')
      .single()
    
    if (userError || !currentUser) {
      console.error('❌ 現在のユーザーが見つかりません:', userError)
      return
    }
    
    console.log('👤 現在のユーザー:', {
      email: 'ito.dev@ii-stylelab.com',
      name: currentUser.name,
      company_id: currentUser.company_id
    })
    
    // 現在のユーザーの会社に属するプロジェクトを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number, company_id')
      .eq('company_id', currentUser.company_id)
    
    console.log('📋 現在のユーザーの会社のプロジェクト:')
    projects?.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
    })
    console.log(`総数: ${projects?.length || 0}件`)
    
    // 現在のユーザーの会社に属する予算科目を取得
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('id, name, level, company_id')
      .eq('company_id', currentUser.company_id)
    
    console.log('📋 現在のユーザーの会社の予算科目:')
    categories?.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (レベル${category.level})`)
    })
    console.log(`総数: ${categories?.length || 0}件`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCurrentUserData()
