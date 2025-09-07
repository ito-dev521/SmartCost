const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUniqueConstraints() {
  try {
    console.log('🔍 bank_balance_historyテーブルの制約確認...\n')

    // 既存データを取得して重複を確認
    const { data, error } = await supabase
      .from('bank_balance_history')
      .select('fiscal_year, balance_date, company_id')
      .order('fiscal_year, balance_date')

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    console.log(`📊 全データ件数: ${data.length}件`)
    
    // 重複チェック
    const duplicates = []
    const seen = new Set()
    
    data.forEach(record => {
      const key = `${record.fiscal_year}-${record.balance_date}`
      if (seen.has(key)) {
        duplicates.push(record)
      } else {
        seen.add(key)
      }
    })

    if (duplicates.length > 0) {
      console.log(`\n⚠️  重複データが${duplicates.length}件見つかりました:`)
      duplicates.forEach(dup => {
        console.log(`  - fiscal_year: ${dup.fiscal_year}, balance_date: ${dup.balance_date}, company_id: ${dup.company_id}`)
      })
    } else {
      console.log('\n✅ 重複データは見つかりませんでした')
    }

    // 会社ID別のデータ分布を確認
    const companyData = {}
    data.forEach(record => {
      if (!companyData[record.company_id]) {
        companyData[record.company_id] = []
      }
      companyData[record.company_id].push(record)
    })

    console.log('\n📊 会社ID別データ分布:')
    Object.keys(companyData).forEach(companyId => {
      console.log(`  - 会社ID ${companyId}: ${companyData[companyId].length}件`)
    })

    // 同じ年月のデータが複数あるかチェック
    const monthYearData = {}
    data.forEach(record => {
      const monthYear = record.balance_date.substring(0, 7) // YYYY-MM
      const key = `${record.fiscal_year}-${monthYear}`
      if (!monthYearData[key]) {
        monthYearData[key] = []
      }
      monthYearData[key].push(record)
    })

    console.log('\n📊 年月別データ分布:')
    Object.keys(monthYearData).forEach(key => {
      if (monthYearData[key].length > 1) {
        console.log(`  ⚠️  ${key}: ${monthYearData[key].length}件 (重複の可能性)`)
        monthYearData[key].forEach(record => {
          console.log(`    - company_id: ${record.company_id}, balance_date: ${record.balance_date}`)
        })
      } else {
        console.log(`  ✅ ${key}: ${monthYearData[key].length}件`)
      }
    })

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

checkUniqueConstraints()
