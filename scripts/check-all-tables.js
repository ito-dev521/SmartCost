#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
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

async function checkAllTables() {
  try {
    console.log('🔍 全テーブル確認を開始...')

    // 1. 基本的なテーブル一覧を取得
    console.log('\n📋 基本テーブル一覧:')
    const tables = [
      'admin_settings',
      'super_admins',
      'users',
      'projects',
      'daily_reports',
      'departments',
      'salary_entries',
      'salary_allocations'
    ]

    for (const tableName of tables) {
      try {
        console.log(`\n--- ${tableName} ---`)

        // テーブルの存在確認
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ アクセスエラー: ${error.message}`)
          console.log(`   コード: ${error.code}`)
        } else {
          console.log(`✅ アクセス成功`)
          console.log(`   レコード数: ${data?.length || 0}`)

          // admin_settingsの場合は詳細情報を表示
          if (tableName === 'admin_settings' && data && data.length > 0) {
            console.log('   設定内容:')
            data.forEach((setting, index) => {
              console.log(`     ${index + 1}. ${setting.setting_key}: ${setting.setting_value}`)
              console.log(`        説明: ${setting.description}`)
              console.log(`        ID: ${setting.id}`)
            })
          }
        }

        // テーブルの構造確認（information_schema使用）
        try {
          const { data: columns, error: columnError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', tableName)
            .eq('table_schema', 'public')

          if (!columnError && columns && columns.length > 0) {
            console.log('   カラム情報:')
            columns.forEach(col => {
              console.log(`     - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL可' : 'NOT NULL'})`)
            })
          }
        } catch (colErr) {
          // information_schemaへのアクセスが失敗しても無視
        }

      } catch (tableError) {
        console.log(`❌ テーブルエラー: ${tableError.message}`)
      }
    }

    // 2. admin_settingsテーブルの再作成を試行
    console.log('\n🔧 admin_settingsテーブル再作成:')
    try {
      // テーブルが存在するか確認
      const { data: existingData, error: checkError } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)

      if (checkError && checkError.code === 'PGRST116') {
        console.log('   テーブルが存在しないため、再作成します...')

        // テーブル作成SQLの実行
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS admin_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            setting_key VARCHAR(255) NOT NULL UNIQUE,
            setting_value TEXT,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        console.log('   テーブル作成SQL実行...')
        // 直接SQL実行は難しいので、代替案として既存のSQLファイルを使用
        console.log('   📄 database/create_admin_settings_table.sql を実行してください')

      } else if (existingData) {
        console.log('   テーブルは存在します')
        console.log(`   既存レコード数: ${existingData.length}`)
      }

    } catch (createError) {
      console.log(`❌ テーブル再作成エラー: ${createError.message}`)
    }

  } catch (error) {
    console.error('❌ 確認エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  checkAllTables()
}

module.exports = { checkAllTables }






