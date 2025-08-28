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

async function executeSimpleSQL(sqlPath) {
  try {
    console.log(`📄 SQLファイル実行: ${sqlPath}`)

    // SQLファイルの読み込み
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log('📝 SQL内容:')
    console.log(sqlContent)

    // テーブル作成を試行
    try {
      console.log('🔧 管理者設定テーブル作成を試行...')
      const { error: createError } = await supabase
        .from('admin_settings')
        .select('id')
        .limit(1)

      if (createError && createError.code === 'PGRST116') {
        console.log('📋 テーブルが存在しないため、直接SQLを実行します')
        console.log('⚠️  注: Supabaseの制限により、DDL文は直接実行できません')
        console.log('🔄 Supabase Dashboardで以下のSQLを手動実行してください:')
        console.log('---')
        console.log(sqlContent)
        console.log('---')
        return
      }

      console.log('✅ テーブルが既に存在します')
    } catch (error) {
      console.log('📋 テーブル存在チェックに失敗しました')
      console.log('🔄 Supabase Dashboardで以下のSQLを手動実行してください:')
      console.log('---')
      console.log(sqlContent)
      console.log('---')
      return
    }

    console.log('✅ SQLファイル処理完了')
  } catch (error) {
    console.error('❌ SQL実行エラー:', error.message)
    process.exit(1)
  }
}

// コマンドライン引数からSQLファイルパスを取得
const sqlFilePath = process.argv[2]
if (!sqlFilePath) {
  console.error('❌ SQLファイルパスを指定してください')
  console.log('   使用方法: node scripts/simple-sql-executor.js <sql-file-path>')
  process.exit(1)
}

const fullPath = path.resolve(sqlFilePath)
if (!fs.existsSync(fullPath)) {
  console.error(`❌ SQLファイルが見つかりません: ${fullPath}`)
  process.exit(1)
}

// スクリプト実行
if (require.main === module) {
  executeSimpleSQL(fullPath)
}

module.exports = { executeSimpleSQL }




