import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Project {
  id: string
  name: string
  business_number: string | null
  contract_amount: number | null
  start_date: string | null
  end_date: string | null
  client_name: string | null
  status: string
}

interface CaddonBilling {
  id: string
  billing_month: string
  amount: number
}

interface SplitBilling {
  project_id: string
  billing_month: string
  amount: number
}

interface MonthlyData {
  month: number
  year: number
  amount: number
}

export async function GET(request: NextRequest) {
  try {
    console.log('Annual revenue schedule API called')

    // Supabaseクライアントを作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // プロジェクトデータを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('business_number', { ascending: true })

    if (projectsError) {
      console.error('プロジェクトデータ取得エラー:', projectsError)
    }

    // CADDON請求データを取得
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')

    if (caddonError) {
      console.error('CADDON請求データ取得エラー:', caddonError)
    }

    // 分割入金データを取得
    const { data: splitBillings, error: splitError } = await supabase
      .from('split_billing')
      .select('project_id, billing_month, amount')

    if (splitError) {
      console.error('分割入金データ取得エラー:', splitError)
    }

    console.log('取得したデータ:', {
      projects: projects?.length || 0,
      caddonBillings: caddonBillings?.length || 0,
      splitBillings: splitBillings?.length || 0
    })

    // 現在の年度を取得
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // 今期の範囲を決定（4月〜翌年3月）
    const fiscalStartMonth = 4
    const fiscalEndMonth = 3

    // 月毎の収入データを初期化
    const monthlyMap: { [key: string]: number } = {}

    // 今期の各月を初期化
    for (let month = fiscalStartMonth; month <= 12; month++) {
      const key = `${currentYear}-${String(month).padStart(2, '0')}`
      monthlyMap[key] = 0
    }
    for (let month = 1; month <= fiscalEndMonth; month++) {
      const key = `${currentYear + 1}-${String(month).padStart(2, '0')}`
      monthlyMap[key] = 0
    }

    // プロジェクトの収入を月毎に分配
    if (projects) {
      console.log('プロジェクトデータ処理開始:', projects.length, '件')
      let processedProjects = 0
      let totalContractAmount = 0
      
      projects.forEach(project => {
        // 一般管理費を除外
        if (project.name.includes('一般管理費') || project.name.includes('その他経費')) {
          console.log(`プロジェクト ${project.business_number} (${project.name}): 一般管理費のためスキップ`)
          return
        }

        // CADDONプロジェクトの場合
        if (project.business_number?.startsWith('C') || project.name.includes('CADDON')) {
          console.log(`CADDONプロジェクト処理: ${project.business_number} (${project.name})`)
          
          // このプロジェクトのCADDON請求を取得
          const projectBillings = caddonBillings?.filter(billing => billing.project_id === project.id)
          if (projectBillings && projectBillings.length > 0) {
            projectBillings.forEach(billing => {
              // total_amountフィールドを使用（年間入金予定表の表示と同じ）
              const amount = billing.total_amount || billing.amount || 0
              if (amount > 0) {
                const billingDate = new Date(billing.billing_month)
                const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
                if (monthlyMap[key] !== undefined) {
                  monthlyMap[key] += amount
                  console.log(`CADDON請求: ${key} に ${amount.toLocaleString()}円 追加 (${project.business_number} - ${billing.billing_month})`)
                } else {
                  console.log(`CADDON請求: ${key} は今期の範囲外 (${project.business_number} - ${billing.billing_month})`)
                }
              } else {
                console.log(`CADDON請求: ${project.business_number} の ${billing.billing_month} は金額0円のためスキップ`)
              }
            })
          } else {
            console.log(`CADDONプロジェクト ${project.business_number} の請求データが見つかりません`)
          }
          processedProjects++
          return
        }

        // 通常プロジェクトの場合
        if (!project.contract_amount || project.contract_amount <= 0) {
          console.log(`プロジェクト ${project.business_number} (${project.name}): 契約金額なし`)
          return
        }

        totalContractAmount += project.contract_amount
        console.log(`プロジェクト ${project.business_number} (${project.name}): 契約金額 ${project.contract_amount}`)

        // 分割入金がある場合はそれを優先
        const splits = splitBillings?.filter(sb => sb.project_id === project.id)
        if (splits && splits.length > 0) {
          splits.forEach(split => {
            // 金額が0円またはnullの場合はスキップ
            if (!split.amount || split.amount <= 0) {
              console.log(`分割入金: ${project.business_number} の ${split.billing_month} は金額0円のためスキップ`)
              return
            }
            
            const billingDate = new Date(split.billing_month)
            const key = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
            if (monthlyMap[key] !== undefined) {
              monthlyMap[key] += split.amount
              console.log(`分割入金: ${key} に ${split.amount.toLocaleString()}円 追加 (${project.business_number})`)
            } else {
              console.log(`分割入金: ${key} は今期の範囲外 (${project.business_number} - ${split.billing_month})`)
            }
          })
          return // 分割入金がある場合は終了日ベースの処理はスキップ
        } else if (project.end_date) {
          // 終了日に基づいて収入を計上
          const endDate = new Date(project.end_date)
          const key = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`
          if (monthlyMap[key] !== undefined) {
            monthlyMap[key] += project.contract_amount
            console.log(`終了日ベース: ${key} に ${project.contract_amount} 追加`)
          }
        }
        processedProjects++
      })
      
      console.log(`プロジェクト処理完了: ${processedProjects}件処理, 総契約金額: ${totalContractAmount}`)
    }

    // CADDON請求はプロジェクトベースで処理済み
    console.log('CADDON請求データ処理: プロジェクトベースで処理済み')

    // map -> MonthlyData[] に変換
    const monthlyTotals: MonthlyData[] = Object.entries(monthlyMap)
      .map(([key, amount]) => {
        const [yearStr, monthStr] = key.split('-')
        return {
          year: parseInt(yearStr, 10),
          month: parseInt(monthStr, 10),
          amount,
        }
      })
      .sort((a, b) => {
        // 今期の順序でソート（4月〜翌年3月）
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

    // 年間合計を計算
    const annualTotal = monthlyTotals.reduce((sum, month) => sum + month.amount, 0)

    console.log('月毎の収入データ:')
    monthlyTotals.forEach(month => {
      console.log(`  ${month.year}年${month.month}月: ${month.amount.toLocaleString()}円`)
    })
    
    console.log('年間入金予定表データ:', { 
      monthlyTotals: monthlyTotals.length, 
      annualTotal: annualTotal.toLocaleString(),
      monthlyMap: monthlyMap
    })

    return NextResponse.json({
      monthlyTotals,
      annualTotal,
      fiscalYear: currentYear,
      fiscalStartMonth,
      fiscalEndMonth
    })

  } catch (error) {
    console.error('年間入金予定表取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
