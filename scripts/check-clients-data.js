const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.localファイルを読み込み
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (value && !value.startsWith('#')) {
          envVars[key.trim()] = value
        }
      }
    })
    
    return envVars
  }
  return {}
}

const envVars = loadEnvFile()

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClientsData() {
  try {
    console.log('🔍 クライアントテーブルのデータを確認中...')
    
    // 全クライアントデータを取得
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
    
    if (allClientsError) {
      console.error('❌ 全クライアント取得エラー:', allClientsError)
      return
    }
    
    console.log('📋 全クライアント数:', allClients?.length || 0)
    
    if (allClients && allClients.length > 0) {
      console.log('📋 クライアント一覧:')
      allClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ID: ${client.id}, 名前: ${client.name}, 会社ID: ${client.company_id}`)
      })
    } else {
      console.log('⚠️  クライアントデータが存在しません')
    }
    
    // 会社テーブルのデータも確認
    console.log('\n🔍 会社テーブルのデータを確認中...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
    
    if (companiesError) {
      console.error('❌ 会社データ取得エラー:', companiesError)
      return
    }
    
    console.log('📋 会社数:', companies?.length || 0)
    if (companies && companies.length > 0) {
      companies.forEach((company, index) => {
        console.log(`  ${index + 1}. ID: ${company.id}, 名前: ${company.name}`)
      })
    }
    
    // ユーザーテーブルのデータも確認
    console.log('\n🔍 ユーザーテーブルのデータを確認中...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, company_id, role')
      .limit(5)
    
    if (usersError) {
      console.error('❌ ユーザーデータ取得エラー:', usersError)
      return
    }
    
    console.log('📋 ユーザー数（最初の5件）:', users?.length || 0)
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, メール: ${user.email}, 会社ID: ${user.company_id}, ロール: ${user.role}`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

checkClientsData()
