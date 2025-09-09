const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsersCompanyId() {
  try {
    console.log('🔍 usersテーブルのcompany_id状況確認...\n')
    
    // 1. すべてのユーザーデータを取得
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, company_id, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ ユーザーデータ取得エラー:', error)
      return
    }

    console.log(`📊 ユーザー総数: ${users?.length || 0}件\n`)

    // 2. company_idが設定されているユーザー
    const usersWithCompanyId = users?.filter(user => user.company_id) || []
    console.log(`✅ company_id設定済み: ${usersWithCompanyId.length}件`)
    
    if (usersWithCompanyId.length > 0) {
      console.log('📋 company_id設定済みユーザー:')
      usersWithCompanyId.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.role}) - company_id: ${user.company_id}`)
      })
    }

    // 3. company_idがnullのユーザー
    const usersWithoutCompanyId = users?.filter(user => !user.company_id) || []
    console.log(`\n❌ company_id未設定: ${usersWithoutCompanyId.length}件`)
    
    if (usersWithoutCompanyId.length > 0) {
      console.log('📋 company_id未設定ユーザー:')
      usersWithoutCompanyId.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.role}) - company_id: null`)
      })
    }

    // 4. 会社データの確認
    console.log('\n📋 会社データの確認:')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email')
      .order('created_at', { ascending: true })

    if (companiesError) {
      console.error('❌ 会社データ取得エラー:', companiesError)
    } else {
      console.log(`📊 会社総数: ${companies?.length || 0}件`)
      if (companies && companies.length > 0) {
        companies.forEach((company, index) => {
          console.log(`  ${index + 1}. ${company.name} (${company.email}) - ID: ${company.id}`)
        })
      }
    }

    // 5. 推奨修正方法
    console.log('\n📋 推奨修正方法:')
    if (usersWithoutCompanyId.length > 0) {
      console.log('  📝 company_idがnullのユーザーを修正する必要があります:')
      console.log('    1. 各ユーザーがどの会社に属するかを確認')
      console.log('    2. 適切なcompany_idを設定')
      console.log('    3. 新規ユーザー作成時にcompany_idを自動設定')
      
      console.log('\n  🔧 修正用SQL例:')
      console.log('    -- 特定のユーザーのcompany_idを設定')
      console.log('    UPDATE users SET company_id = \'[会社ID]\' WHERE email = \'[ユーザーEmail]\';')
    } else {
      console.log('  ✅ すべてのユーザーにcompany_idが設定されています')
    }

    console.log('\n✅ usersテーブルのcompany_id状況確認完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkUsersCompanyId()
