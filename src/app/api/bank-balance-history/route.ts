import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: 銀行残高履歴を取得（実データ）
export async function GET(request: NextRequest) {
  try {
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

    // クエリパラメータ（年度や件数の絞り込み）
    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscal_year')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : undefined

    let query = supabase
      .from('bank_balance_history')
      .select('*')
      .order('balance_date', { ascending: true })

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear, 10))
    }
    if (limit && Number.isFinite(limit)) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('bank_balance_history 取得エラー:', error)
      return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ history: data || [], total: data?.length || 0 })
  } catch (error) {
    console.error('銀行残高履歴APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい銀行残高履歴を作成（実データ）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    const { data, error } = await supabase
      .from('bank_balance_history')
      .insert([body])
      .select('*')

    if (error) {
      console.error('bank_balance_history 作成エラー:', error)
      return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: '銀行残高履歴を作成しました', history: data?.[0] })
  } catch (error) {
    console.error('銀行残高履歴作成APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
