const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCurrentUsers() {
  try {
    console.log('🔍 現在のユーザー一覧を取得中...')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ ユーザー取得エラー:', error)
      return
    }

    console.log('📋 ユーザー一覧:')
    console.log('=' .repeat(80))
    
    if (!users || users.length === 0) {
      console.log('ユーザーが登録されていません')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   名前: ${user.name}`)
        console.log(`   ロール: ${user.role}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   作成日: ${user.created_at}`)
        console.log('---')
      })
    }

    console.log('=' .repeat(80))
    console.log(`総ユーザー数: ${users?.length || 0}`)
    
    const adminUsers = users?.filter(user => user.role === 'admin') || []
    console.log(`管理者数: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('⚠️ 管理者ユーザーが存在しません')
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCurrentUsers()




