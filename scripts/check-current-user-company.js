const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCurrentUserCompany() {
  try {
    console.log('🔍 現在ログインしているユーザーの会社情報を確認します...\n')

    // 現在ログインしているユーザーを特定（テスト会社10のユーザー）
    const testUserEmail = 'ito.dev@ii-stylelab.com'
    
    console.log(`📋 ユーザー "${testUserEmail}" の情報を取得:`)
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUserEmail)
      .single()

    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError)
      return
    }

    if (!user) {
      console.log('❌ ユーザーが見つかりません')
      return
    }

    console.log('✅ ユーザー情報:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - 名前: ${user.name}`)
    console.log(`  - メール: ${user.email}`)
    console.log(`  - ロール: ${user.role}`)
    console.log(`  - 会社ID: ${user.company_id}`)

    if (user.company_id) {
      // 会社情報を取得
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.company_id)
        .single()

      if (companyError) {
        console.error('❌ 会社情報取得エラー:', companyError)
      } else if (company) {
        console.log('✅ 会社情報:')
        console.log(`  - ID: ${company.id}`)
        console.log(`  - 名前: ${company.name}`)
      }
    } else {
      console.log('⚠️ ユーザーに会社IDが設定されていません')
    }

    // 同じ会社の他のユーザーを確認
    if (user.company_id) {
      console.log(`\n📋 同じ会社 (${user.company_id}) の他のユーザー:`)
      
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })

      if (companyUsersError) {
        console.error('❌ 会社ユーザー取得エラー:', companyUsersError)
      } else if (companyUsers && companyUsers.length > 0) {
        companyUsers.forEach((companyUser, index) => {
          console.log(`  ${index + 1}. ${companyUser.name} (${companyUser.email}) - ${companyUser.role}`)
        })
      } else {
        console.log('  ⚠️ 同じ会社のユーザーが見つかりません')
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCurrentUserCompany()
