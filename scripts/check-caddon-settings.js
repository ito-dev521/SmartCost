const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCaddonSettings() {
  try {
    console.log('🔍 CADDON設定の確認を開始します...\n')

    // 1. 会社一覧を取得
    console.log('📋 会社一覧:')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')

    if (companiesError) {
      console.error('❌ 会社取得エラー:', companiesError)
      return
    }

    companies.forEach(company => {
      console.log(`  - ${company.name} (ID: ${company.id})`)
    })

    // 2. 会社設定を取得
    console.log('\n📋 会社設定 (company_settings):')
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('company_id, caddon_enabled')
      .order('company_id')

    if (settingsError) {
      console.error('❌ 会社設定取得エラー:', settingsError)
      return
    }

    if (companySettings.length === 0) {
      console.log('  ⚠️ 会社設定データがありません')
    } else {
      companySettings.forEach(setting => {
        const company = companies.find(c => c.id === setting.company_id)
        const companyName = company ? company.name : '不明'
        console.log(`  - ${companyName}: CADDON ${setting.caddon_enabled ? '有効' : '無効'}`)
      })
    }

    // 3. ユーザー一覧を取得
    console.log('\n📋 ユーザー一覧:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, company_id, role')
      .order('email')

    if (usersError) {
      console.error('❌ ユーザー取得エラー:', usersError)
      return
    }

    users.forEach(user => {
      const company = companies.find(c => c.id === user.company_id)
      const companyName = company ? company.name : '不明'
      const setting = companySettings.find(s => s.company_id === user.company_id)
      const caddonStatus = setting ? (setting.caddon_enabled ? '有効' : '無効') : '未設定'
      console.log(`  - ${user.email} (${user.name}) - ${companyName} - CADDON: ${caddonStatus}`)
    })

    // 4. admin_settingsも確認
    console.log('\n📋 管理者設定 (admin_settings):')
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('*')

    if (adminError) {
      console.error('❌ 管理者設定取得エラー:', adminError)
    } else if (adminSettings.length === 0) {
      console.log('  ⚠️ 管理者設定データがありません')
    } else {
      adminSettings.forEach(setting => {
        console.log(`  - ${setting.setting_key}: ${setting.setting_value}`)
      })
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCaddonSettings()
