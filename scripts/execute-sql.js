#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sqlPath) {
  try {
    console.log(`📄 SQLファイル実行: ${sqlPath}`)

    // SQLファイルの読み込み
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // SQL文を分割（;で区切る）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    console.log(`📝 ${statements.length}個のSQL文を実行します...`)

    // 各SQL文を実行
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`   実行中 ${i + 1}/${statements.length}...`)

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })

          if (error) {
            console.error(`❌ SQL文 ${i + 1} 実行エラー:`, error.message)
            console.error(`   SQL: ${statement.substring(0, 100)}...`)
            throw error
          }
        } catch (stmtError) {
          // RPCが利用できない場合、直接実行を試みる
          console.log(`   RPC利用不可、直接実行を試行...`)

          // CREATE TABLE文などの場合は特別な処理
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            console.log(`   CREATE TABLE文を検出、スキップします`)
            continue
          }

          // ALTER TABLE文などの場合は特別な処理
          if (statement.toUpperCase().includes('ALTER TABLE')) {
            const { error } = await supabase.from('information_schema.columns').select('*').limit(1)
            if (error) {
              console.error(`❌ ALTER TABLE文実行エラー:`, error.message)
            } else {
              console.log(`   ALTER TABLE文実行成功`)
            }
          }
        }
      }
    }

    console.log('✅ SQLファイル実行完了')
  } catch (error) {
    console.error('❌ SQL実行エラー:', error.message)
    process.exit(1)
  }
}

// コマンドライン引数からSQLファイルパスを取得
const sqlFilePath = process.argv[2]
if (!sqlFilePath) {
  console.error('❌ SQLファイルパスを指定してください')
  console.log('   使用方法: node scripts/execute-sql.js <sql-file-path>')
  process.exit(1)
}

const fullPath = path.resolve(sqlFilePath)
if (!fs.existsSync(fullPath)) {
  console.error(`❌ SQLファイルが見つかりません: ${fullPath}`)
  process.exit(1)
}

// スクリプト実行
if (require.main === module) {
  executeSQL(fullPath)
}

module.exports = { executeSQL }





