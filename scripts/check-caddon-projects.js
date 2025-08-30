const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCaddonProjects() {
  try {
    console.log('🔍 CADDONシステムのプロジェクトデータを確認中...')
    
    // CADDONシステムのプロジェクトを検索
    const { data: caddonProjects, error } = await supabase
      .from('projects')
      .select('*')
      .or('name.ilike.%CADDON%,business_number.ilike.C%')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    console.log(`📋 CADDONシステムのプロジェクト数: ${caddonProjects?.length || 0}`)
    
    if (caddonProjects && caddonProjects.length > 0) {
      console.log('\n📋 CADDONシステムのプロジェクト詳細:')
      caddonProjects.forEach((project, index) => {
        console.log(`\n--- プロジェクト ${index + 1} ---`)
        console.log(`ID: ${project.id}`)
        console.log(`名前: ${project.name}`)
        console.log(`業務番号: ${project.business_number || '未設定'}`)
        console.log(`クライアント名: ${project.client_name || '未設定'}`)
        console.log(`契約金額: ${project.contract_amount || '未設定'}`)
        console.log(`開始日: ${project.start_date || '未設定'}`)
        console.log(`終了日: ${project.end_date || '未設定'}`)
        console.log(`作成日: ${project.created_at}`)
        console.log(`更新日: ${project.updated_at}`)
      })
    } else {
      console.log('✅ CADDONシステムのプロジェクトは見つかりませんでした')
    }

    // 業務番号C001のプロジェクトを確認
    console.log('\n🔍 業務番号C001のプロジェクトを確認中...')
    const { data: c001Projects, error: c001Error } = await supabase
      .from('projects')
      .select('*')
      .eq('business_number', 'C001')

    if (c001Error) {
      console.error('❌ C001プロジェクト取得エラー:', c001Error)
      return
    }

    console.log(`📋 業務番号C001のプロジェクト数: ${c001Projects?.length || 0}`)
    
    if (c001Projects && c001Projects.length > 0) {
      console.log('\n📋 業務番号C001のプロジェクト詳細:')
      c001Projects.forEach((project, index) => {
        console.log(`\n--- プロジェクト ${index + 1} ---`)
        console.log(`ID: ${project.id}`)
        console.log(`名前: ${project.name}`)
        console.log(`業務番号: ${project.business_number}`)
        console.log(`クライアント名: ${project.client_name || '未設定'}`)
        console.log(`契約金額: ${project.contract_amount || '未設定'}`)
        console.log(`作成日: ${project.created_at}`)
      })
    }

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

checkCaddonProjects()
