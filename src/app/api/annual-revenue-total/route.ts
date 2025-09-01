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
  project_id: string
  billing_month: string
  total_amount: number
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
    console.log('Annual revenue total API called')

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
      return NextResponse.json({ error: 'プロジェクトデータ取得エラー' }, { status: 500 })
    }

    // CADDON請求データを取得
    const { data: caddonBillings, error: caddonError } = await supabase
      .from('caddon_billing')
      .select('*')
      .order('billing_month')

    if (caddonError) {
      console.error('CADDON請求データ取得エラー:', caddonError)
    }

    // クライアントデータを取得
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')

    if (clientsError) {
      console.error('クライアントデータ取得エラー:', clientsError)
    }

    // 決算情報を取得
    const cookieStore = await cookies()
    const fiCookie = cookieStore.get('fiscal-info')
    let settlementMonth = 3
    if (fiCookie) {
      try {
        const fi = JSON.parse(fiCookie.value)
        settlementMonth = fi.settlement_month || 3
      } catch {}
    }

    // 年間入金予定表の画面と同じ計算方法
    let totalRevenue = 0

    // 一般管理費を除外したプロジェクトを取得
    const filteredProjects = (projects || []).filter(project => 
      !project.name.includes('一般管理費') && 
      !project.name.includes('その他経費')
    )

    filteredProjects.forEach(project => {
      const client = (clients || []).find(c => c.name === project.client_name)

      if (project.business_number?.startsWith('C') || project.name.includes('CADDON')) {
        // CADDONプロジェクトの場合
        const projectBillings = (caddonBillings || []).filter(billing => billing.project_id === project.id)
        projectBillings.forEach(billing => {
          totalRevenue += billing.total_amount || 0
        })
      } else {
        // 通常プロジェクトの場合
        if (project.end_date && project.contract_amount && client) {
          const paymentDate = calculatePaymentDate(project.end_date, client)
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          
          // 年間入金予定表の画面では、すべてのプロジェクトの契約金額を合計している
          totalRevenue += project.contract_amount
        }
      }
    })

    console.log('年間入金予定表の画面と同じ方法で計算した年間合計:', totalRevenue)

    return NextResponse.json({
      annualTotal: totalRevenue,
      success: true
    })

  } catch (error) {
    console.error('年間入金予定表合計取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
