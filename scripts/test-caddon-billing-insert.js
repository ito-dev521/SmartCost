require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCaddonBillingInsert() {
  try {
    console.log('🧪 CADDON請求テーブルへの挿入テスト...')
    
    // テスト用のプロジェクトとクライアントを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1)
    
    if (projectsError || !projects || projects.length === 0) {
      console.error('プロジェクトが見つかりません:', projectsError)
      return
    }
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1)
    
    if (clientsError || !clients || clients.length === 0) {
      console.error('クライアントが見つかりません:', clientsError)
      return
    }
    
    console.log('テスト用データ:', {
      project: projects[0],
      client: clients[0]
    })
    
    // テストデータを挿入
    const testData = {
      project_id: projects[0].id,
      client_id: clients[0].id,
      billing_month: '2025-08', // YYYY-MM形式
      caddon_usage_fee: 150000,
      initial_setup_fee: 200000,
      support_fee: 50000,
      total_amount: 400000,
      billing_status: 'pending',
      notes: 'テスト用データ'
    }
    
    console.log('挿入するデータ:', testData)
    
    const { data, error } = await supabase
      .from('caddon_billing')
      .insert([testData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ 挿入エラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return
    }
    
    console.log('✅ 挿入成功:', data)
    
    // テストデータを削除
    const { error: deleteError } = await supabase
      .from('caddon_billing')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.error('テストデータ削除エラー:', deleteError)
    } else {
      console.log('🧹 テストデータを削除しました')
    }
    
  } catch (error) {
    console.error('予期しないエラー:', error)
  }
}

testCaddonBillingInsert()
