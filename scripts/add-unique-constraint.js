const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addUniqueConstraint() {
  try {
    console.log('🔧 bank_balance_historyテーブルにユニーク制約を追加中...')

    // 既存のデータで重複チェック
    const { data: existingData, error: fetchError } = await supabase
      .from('bank_balance_history')
      .select('fiscal_year, balance_date')

    if (fetchError) {
      console.log('❌ データ取得エラー:', fetchError.message)
      return
    }

    // 年月での重複チェック（年度は除外）
    const monthYearMap = new Map()
    const duplicates = []

    existingData.forEach(record => {
      const monthYear = record.balance_date.substring(0, 7) // 年月のみ（例：2025-08）
      if (monthYearMap.has(monthYear)) {
        duplicates.push(monthYear)
      } else {
        monthYearMap.set(monthYear, record)
      }
    })

    if (duplicates.length > 0) {
      console.log('⚠️ 重複データが検出されました:')
      duplicates.forEach(dup => console.log(`  - ${dup}`))
      console.log('重複データを削除してから制約を追加してください')
      return
    }

    // ユニーク制約の追加（年月のみ）
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE bank_balance_history 
        ADD CONSTRAINT unique_month_year 
        UNIQUE (DATE_TRUNC('month', balance_date));
      `
    })

    if (constraintError) {
      console.log('⚠️ ユニーク制約追加エラー（既に存在する可能性）:', constraintError.message)
      
      // 代替案：より簡単な制約を試行
      const { error: simpleConstraintError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE bank_balance_history 
          ADD CONSTRAINT unique_month_year_simple 
          UNIQUE (EXTRACT(YEAR FROM balance_date), EXTRACT(MONTH FROM balance_date));
        `
      })

      if (simpleConstraintError) {
        console.log('⚠️ 代替制約追加エラー:', simpleConstraintError.message)
      } else {
        console.log('✅ 代替ユニーク制約追加完了')
      }
    } else {
      console.log('✅ ユニーク制約追加完了')
    }

    // 制約の確認
    console.log('🔍 制約の確認中...')
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT conname, contype, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'bank_balance_history'::regclass;
      `
    })

    if (checkError) {
      console.log('⚠️ 制約確認エラー:', checkError.message)
    } else {
      console.log('📋 現在の制約一覧:')
      console.log(constraints)
    }

    console.log('🎉 ユニーク制約の設定が完了しました')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

addUniqueConstraint()
