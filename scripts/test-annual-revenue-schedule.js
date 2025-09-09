const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAnnualRevenueSchedule() {
  try {
    console.log('🔍 年間入金予定表の計算テスト開始...\n')
    
    // テスト用の会社ID（サンプル建設コンサルタント）
    const testCompanyId = '4440fcae-03f2-4b0c-8c55-e19017ce08c9'
    
    // 1. CADDON請求データを取得
    console.log('📋 1. CADDON請求データの取得:')
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('id, billing_month, amount, total_amount, project_id')
      .eq('company_id', testCompanyId)
      .order('billing_month')

    if (caddonError) {
      console.error('❌ CADDON請求データ取得エラー:', caddonError)
      return
    }

    console.log(`📊 CADDON請求レコード数: ${caddonBillings?.length || 0}件`)
    
    if (caddonBillings && caddonBillings.length > 0) {
      caddonBillings.forEach((billing, index) => {
        console.log(`  ${index + 1}. ${billing.billing_month}: amount=${billing.amount}, total_amount=${billing.total_amount}`)
      })
    }

    // 2. CADDONプロジェクトを取得
    console.log('\n📋 2. CADDONプロジェクトの取得:')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number')
      .eq('company_id', testCompanyId)
      .or('business_number.like.C%,name.like.%CADDON%')

    if (projectsError) {
      console.error('❌ プロジェクトデータ取得エラー:', projectsError)
      return
    }

    console.log(`📊 CADDONプロジェクト数: ${projects?.length || 0}件`)
    
    if (projects && projects.length > 0) {
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.business_number} - ${project.name}`)
      })
    }

    // 3. 年間入金予定表の計算をシミュレート
    console.log('\n📋 3. 年間入金予定表の計算:')
    
    // 月別マップを初期化（2025年7月〜2026年6月）
    const monthlyMap = {}
    for (let year = 2025; year <= 2026; year++) {
      for (let month = 7; month <= 12; month++) {
        if (year === 2025) {
          monthlyMap[`${year}-${String(month).padStart(2, '0')}`] = 0
        }
      }
      for (let month = 1; month <= 6; month++) {
        if (year === 2026) {
          monthlyMap[`${year}-${String(month).padStart(2, '0')}`] = 0
        }
      }
    }

    console.log('📊 月別マップの初期化完了')
    console.log('📊 対象期間:', Object.keys(monthlyMap).sort())

    // CADDONプロジェクトの処理
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        if (project.business_number?.startsWith('C') || project.name.includes('CADDON')) {
          console.log(`\n🔍 CADDONプロジェクト処理: ${project.business_number} - ${project.name}`)
          
          const projectBillings = caddonBillings?.filter(billing => billing.project_id === project.id)
          console.log(`📊 該当プロジェクトの請求データ: ${projectBillings?.length || 0}件`)
          
          if (projectBillings && projectBillings.length > 0) {
            projectBillings.forEach(billing => {
              // amountフィールドを優先使用
              const amount = billing.amount || billing.total_amount || 0
              console.log(`  💰 ${billing.billing_month}: amount=${billing.amount}, total_amount=${billing.total_amount}, 使用値=${amount}`)
              
              if (amount > 0) {
                const billingDate = new Date(billing.billing_month)
                const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
                
                if (monthlyMap[key] !== undefined) {
                  monthlyMap[key] += amount
                  console.log(`    ✅ ${key} に ${amount.toLocaleString()}円 追加`)
                } else {
                  console.log(`    ❌ ${key} は今期の範囲外`)
                }
              } else {
                console.log(`    ⚠️  金額0円のためスキップ`)
              }
            })
          } else {
            console.log(`  ❌ 請求データが見つかりません`)
          }
        }
      })
    }

    // 4. 結果の表示
    console.log('\n📋 4. 年間入金予定表の結果:')
    let annualTotal = 0
    
    Object.keys(monthlyMap).sort().forEach(month => {
      const amount = monthlyMap[month]
      if (amount > 0) {
        console.log(`  ${month}: ¥${amount.toLocaleString()}`)
        annualTotal += amount
      }
    })
    
    console.log(`\n📊 年間合計: ¥${annualTotal.toLocaleString()}`)
    
    // 5. 期待値との比較
    console.log('\n📋 5. 期待値との比較:')
    const expectedValues = {
      '2025-10': 500000,
      '2025-11': 940000, // 500000 + 440000
      '2025-12': 600000, // 300000 + 300000
      '2026-01': 508000, // 330000 + 178000
      '2026-02': 420000
    }
    
    let expectedTotal = 0
    Object.keys(expectedValues).forEach(month => {
      const expected = expectedValues[month]
      const actual = monthlyMap[month] || 0
      const match = expected === actual ? '✅' : '❌'
      console.log(`  ${month}: 期待値=¥${expected.toLocaleString()}, 実際=¥${actual.toLocaleString()} ${match}`)
      expectedTotal += expected
    })
    
    console.log(`\n📊 期待値合計: ¥${expectedTotal.toLocaleString()}`)
    console.log(`📊 実際合計: ¥${annualTotal.toLocaleString()}`)
    console.log(`📊 差異: ¥${(expectedTotal - annualTotal).toLocaleString()}`)
    
    console.log('\n✅ 年間入金予定表の計算テスト完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testAnnualRevenueSchedule()
