const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAnnualRevenueData() {
  try {
    console.log('=== 年間入金予定表データ確認 ===\n')

    // プロジェクトデータを確認
    console.log('1. プロジェクトデータ確認')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('business_number', { ascending: true })

    if (projectsError) {
      console.error('プロジェクトデータ取得エラー:', projectsError)
    } else {
      console.log(`プロジェクト数: ${projects?.length || 0}件`)
      if (projects && projects.length > 0) {
        console.log('プロジェクト詳細:')
        projects.forEach(project => {
          console.log(`  ${project.business_number}: ${project.name}`)
          console.log(`    契約金額: ${project.contract_amount?.toLocaleString() || '未設定'}円`)
          console.log(`    開始日: ${project.start_date || '未設定'}`)
          console.log(`    終了日: ${project.end_date || '未設定'}`)
          console.log(`    ステータス: ${project.status}`)
          console.log('')
        })
      }
    }

    // CADDON請求データを確認
    console.log('2. CADDON請求データ確認')
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')

    if (caddonError) {
      console.error('CADDON請求データ取得エラー:', caddonError)
    } else {
      console.log(`CADDON請求数: ${caddonBillings?.length || 0}件`)
      if (caddonBillings && caddonBillings.length > 0) {
        console.log('CADDON請求詳細:')
        caddonBillings.forEach(billing => {
          console.log(`  ${billing.billing_month}: ${billing.amount?.toLocaleString() || 0}円`)
        })
        console.log('')
      }
    }

    // 分割入金データを確認
    console.log('3. 分割入金データ確認')
    const { data: splitBillings, error: splitError } = await supabase
      .from('split_billing')
      .select('project_id, billing_month, amount')

    if (splitError) {
      console.error('分割入金データ取得エラー:', splitError)
    } else {
      console.log(`分割入金数: ${splitBillings?.length || 0}件`)
      if (splitBillings && splitBillings.length > 0) {
        console.log('分割入金詳細:')
        splitBillings.forEach(split => {
          console.log(`  プロジェクトID: ${split.project_id}`)
          console.log(`  請求月: ${split.billing_month}`)
          console.log(`  金額: ${split.amount?.toLocaleString() || 0}円`)
          console.log('')
        })
      }
    }

    // 今期の範囲を確認
    console.log('4. 今期の範囲確認')
    const currentYear = new Date().getFullYear()
    const fiscalStartMonth = 4
    const fiscalEndMonth = 3
    
    console.log(`今期: ${currentYear}年${fiscalStartMonth}月 〜 ${currentYear + 1}年${fiscalEndMonth}月`)
    
    // 月毎の収入データを計算
    const monthlyMap = {}
    
    // 今期の各月を初期化
    for (let month = fiscalStartMonth; month <= 12; month++) {
      const key = `${currentYear}-${String(month).padStart(2, '0')}`
      monthlyMap[key] = 0
    }
    for (let month = 1; month <= fiscalEndMonth; month++) {
      const key = `${currentYear + 1}-${String(month).padStart(2, '0')}`
      monthlyMap[key] = 0
    }

    console.log('今期の月毎キー:')
    Object.keys(monthlyMap).forEach(key => {
      console.log(`  ${key}`)
    })
    console.log('')

    // プロジェクトの収入を月毎に分配
    if (projects) {
      console.log('5. プロジェクト収入の月毎分配')
      projects.forEach(project => {
        if (!project.contract_amount || project.contract_amount <= 0) return

        // 分割入金がある場合はそれを優先
        const split = splitBillings?.find(sb => sb.project_id === project.id)
        if (split) {
          const billingDate = new Date(split.billing_month)
          const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
          if (monthlyMap[key] !== undefined) {
            monthlyMap[key] += split.amount || 0
            console.log(`  ${project.business_number}: ${key} に ${split.amount?.toLocaleString()}円 追加 (分割入金)`)
          }
        } else if (project.end_date) {
          // 終了日に基づいて収入を計上
          const endDate = new Date(project.end_date)
          const key = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`
          if (monthlyMap[key] !== undefined) {
            monthlyMap[key] += project.contract_amount
            console.log(`  ${project.business_number}: ${key} に ${project.contract_amount?.toLocaleString()}円 追加 (終了日ベース)`)
          }
        }
      })
    }

    // CADDON請求も収入として計上
    if (caddonBillings) {
      console.log('\n6. CADDON請求の月毎分配')
      caddonBillings.forEach(billing => {
        const billingDate = new Date(billing.billing_month)
        const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += billing.amount || 0
          console.log(`  ${billing.billing_month}: ${key} に ${billing.amount?.toLocaleString()}円 追加`)
        } else {
          console.log(`  ${billing.billing_month}: ${key} は今期の範囲外`)
        }
      })
    }

    // 結果を表示
    console.log('\n7. 最終結果')
    const monthlyTotals = Object.entries(monthlyMap)
      .map(([key, amount]) => {
        const [yearStr, monthStr] = key.split('-')
        return {
          year: parseInt(yearStr, 10),
          month: parseInt(monthStr, 10),
          amount,
        }
      })
      .sort((a, b) => {
        if (a.month >= 4 && b.month >= 4) {
          return a.month - b.month
        } else if (a.month >= 4) {
          return -1
        } else if (b.month >= 4) {
          return 1
        } else {
          return a.month - b.month
        }
      })

    console.log('月毎の収入データ:')
    monthlyTotals.forEach(month => {
      console.log(`  ${month.year}年${month.month}月: ${month.amount.toLocaleString()}円`)
    })

    const annualTotal = monthlyTotals.reduce((sum, month) => sum + month.amount, 0)
    console.log(`\n年間合計: ${annualTotal.toLocaleString()}円`)

  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

checkAnnualRevenueData()
