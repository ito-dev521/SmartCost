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

async function checkTableStructure() {
  try {
    console.log('🔍 salary_entriesテーブルの構造を確認中...')
    
    // テーブルの構造を確認
    const { data, error } = await supabase
      .from('salary_entries')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ テーブルアクセスエラー:', error.message)
      return
    }
    
    console.log('✅ テーブルアクセス成功')
    console.log('📋 テーブル構造:')
    
    if (data && data.length > 0) {
      const sampleRecord = data[0]
      Object.keys(sampleRecord).forEach(key => {
        console.log(`   ${key}: ${typeof sampleRecord[key]} (${sampleRecord[key]})`)
      })
    } else {
      console.log('   (テーブルは空です)')
    }
    
    // 一般管理費フィールドの存在確認
    if (data && data.length > 0 && 'overhead_labor_cost' in data[0]) {
      console.log('✅ overhead_labor_costフィールドが存在します')
    } else {
      console.log('❌ overhead_labor_costフィールドが存在しません')
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  checkTableStructure()
}


