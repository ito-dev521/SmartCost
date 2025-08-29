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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClientUsage() {
  try {
    console.log('🔍 クライアントIDの使用状況を確認中...')
    
    // 1. プロジェクトテーブルでの使用状況
    console.log('\n📋 プロジェクトテーブルでのクライアント使用状況:')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .not('client_id', 'is', null)
    
    if (projectsError) {
      console.error('❌ プロジェクトデータ取得エラー:', projectsError)
    } else {
      console.log('📊 クライアントIDを持つプロジェクト数:', projects?.length || 0)
      if (projects && projects.length > 0) {
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. プロジェクト: ${project.name}, クライアントID: ${project.client_id}`)
        })
      }
    }
    
    // 2. 原価エントリーテーブルでの使用状況（存在する場合）
    console.log('\n📋 原価エントリーテーブルでのクライアント使用状況:')
    try {
      const { data: costEntries, error: costEntriesError } = await supabase
        .from('cost_entries')
        .select('id, project_id, amount')
        .not('project_id', 'is', null)
        .limit(10)
      
      if (costEntriesError) {
        console.log('⚠️  原価エントリーテーブルは存在しません')
      } else {
        console.log('📊 原価エントリ数（最初の10件）:', costEntries?.length || 0)
      }
    } catch (error) {
      console.log('⚠️  原価エントリーテーブルは存在しません')
    }
    
    // 3. 作業日報テーブルでの使用状況（存在する場合）
    console.log('\n📋 作業日報テーブルでのクライアント使用状況:')
    try {
      const { data: dailyReports, error: dailyReportsError } = await supabase
        .from('daily_reports')
        .select('id, project_id, work_hours')
        .not('project_id', 'is', null)
        .limit(10)
      
      if (dailyReportsError) {
        console.log('⚠️  作業日報テーブルは存在しません')
      } else {
        console.log('📊 作業日報数（最初の10件）:', dailyReports?.length || 0)
      }
    } catch (error) {
      console.log('⚠️  作業日報テーブルは存在しません')
    }
    
    // 4. 現在のクライアント一覧
    console.log('\n📋 現在のクライアント一覧:')
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company_id')
    
    if (clientsError) {
      console.error('❌ クライアントデータ取得エラー:', clientsError)
    } else {
      console.log('📊 クライアント数:', clients?.length || 0)
      if (clients && clients.length > 0) {
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ID: ${client.id}, 名前: ${client.name}, 会社ID: ${client.company_id}`)
        })
      }
    }
    
    console.log('\n✅ クライアントIDの使用状況確認完了')
    console.log('💡 会社IDの変更は、クライアントID自体には影響しません')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

checkClientUsage()




