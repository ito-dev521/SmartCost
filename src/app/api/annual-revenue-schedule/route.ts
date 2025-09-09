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
  total_amount: number
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

interface Client {
  id: string
  name: string
  payment_cycle_type: string
  payment_cycle_closing_day: number
  payment_cycle_payment_month_offset: number
  payment_cycle_payment_day: number
}

// 年間入金予定表と同じ入金予定日計算関数
const calculatePaymentDate = (endDate: string, client: Client): Date => {
  if (!endDate || !client.payment_cycle_type) {
    return new Date(endDate || new Date())
  }

  const end = new Date(endDate)
  const paymentDate = new Date()

  if (client.payment_cycle_type === 'month_end') {
    // 月末締め翌月末払いの場合
    const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
    
    // 完了月から支払い月オフセット分を加算
    const targetYear = end.getFullYear()
    const targetMonth = end.getMonth() + paymentMonthOffset
    
    // 年をまたぐ場合の処理
    const finalYear = targetMonth >= 12 ? targetYear + Math.floor(targetMonth / 12) : targetYear
    const finalMonth = targetMonth >= 12 ? targetMonth % 12 : targetMonth
    
    paymentDate.setFullYear(finalYear)
    paymentDate.setMonth(finalMonth)
    paymentDate.setDate(new Date(finalYear, finalMonth + 1, 0).getDate()) // その月の末日
    
  } else if (client.payment_cycle_type === 'specific_date') {
    // 特定日締めの場合
    const closingDay = client.payment_cycle_closing_day || 25
    const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
    const paymentDay = client.payment_cycle_payment_day || 15

    if (end.getDate() <= closingDay) {
      // 締め日以前の場合は当月締め
      paymentDate.setFullYear(end.getFullYear())
      paymentDate.setMonth(end.getMonth() + paymentMonthOffset)
      paymentDate.setDate(paymentDay)
    } else {
      // 締め日以降の場合は翌月締め
      paymentDate.setFullYear(end.getFullYear())
      paymentDate.setMonth(end.getMonth() + paymentMonthOffset + 1)
      paymentDate.setDate(paymentDay)
    }
  }

  return paymentDate
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

    // ユーザーの会社IDを取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    console.log('🔍 年間入金予定表取得: 会社ID', userData.company_id)

    // プロジェクトデータを取得（会社IDでフィルタリング）
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('business_number', { ascending: true })

    if (projectsError) {
      console.error('プロジェクトデータ取得エラー:', projectsError)
    }

    // CADDON請求データを取得（会社IDでフィルタリング）
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('id, billing_month, amount, total_amount, project_id')
      .eq('company_id', userData.company_id)
      .order('billing_month')

    if (caddonError) {
      console.error('CADDON請求データ取得エラー:', caddonError)
    }

    // クライアントデータを取得（会社IDでフィルタリング）
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', userData.company_id)

    if (clientsError) {
      console.error('クライアントデータ取得エラー:', clientsError)
    }

    console.log('取得したデータ:', {
      projects: projects?.length || 0,
      caddonBillings: caddonBillings?.length || 0
    })

    // 閲覧年度の取得（クッキー fiscal-view-year があれば優先）
    const cookieStore = await cookies()
    const viewYearCookie = cookieStore.get('fiscal-view-year')
    const currentYear = viewYearCookie ? parseInt(viewYearCookie.value, 10) : new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // 決算情報から年度開始月を決定（決算月の翌月）
    const fiCookie = cookieStore.get('fiscal-info')
    let settlementMonth = 3
    if (fiCookie) {
      try {
        const fi = JSON.parse(fiCookie.value)
        settlementMonth = fi.settlement_month || 3
      } catch {}
    }
    const fiscalStartMonth = settlementMonth + 1
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
              // amountフィールドを優先使用（CADDON管理と整合性を保つ）
              const amount = billing.amount || billing.total_amount || 0
              console.log(`CADDON請求データ: ${billing.billing_month} - amount: ${billing.amount}, total_amount: ${billing.total_amount}, 使用値: ${amount}`)
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

        // クライアントの支払いサイクルに基づいて入金予定日を計算
        const client = clients?.find(c => c.name === project.client_name)
        if (project.end_date && client) {
          const paymentDate = calculatePaymentDate(project.end_date, client)
          const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          if (monthlyMap[key] !== undefined) {
            monthlyMap[key] += project.contract_amount
            console.log(`支払いサイクルベース: ${key} に ${project.contract_amount} 追加 (${project.business_number})`)
          } else {
            console.log(`支払いサイクルベース: ${key} は今期の範囲外 (${project.business_number})`)
          }
        } else if (project.end_date) {
          // クライアント情報がない場合は終了日ベース
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
