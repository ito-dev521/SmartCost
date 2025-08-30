import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('fiscal-info GET called')

    // テスト用：決算情報をクッキーに保存して取得
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('All cookies:', allCookies.map(c => c.name))

    const fiscalInfoCookie = allCookies.find(cookie => cookie.name === 'fiscal-info')
    console.log('fiscal-info cookie found:', !!fiscalInfoCookie)

    let fiscalInfo
    if (fiscalInfoCookie) {
      try {
        fiscalInfo = JSON.parse(fiscalInfoCookie.value)
        console.log('Parsed fiscal info:', fiscalInfo)
      } catch (parseError) {
        console.error('Cookie parse error:', parseError)
        fiscalInfo = null
      }
    }

    if (!fiscalInfo) {
      console.log('Using default fiscal info')
      // デフォルト値
      fiscalInfo = {
        id: 'default',
        company_id: 'default-company',
        fiscal_year: new Date().getFullYear(),
        settlement_month: 3,
        current_period: 1,
        bank_balance: 5000000,
        notes: 'デフォルト設定'
      }
    }

    console.log('Returning fiscal info:', fiscalInfo)
    return NextResponse.json({ fiscalInfo })
  } catch (error) {
    console.error('GET: 決算情報取得エラー:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('fiscal-info POST called')
    const body = await request.json()
    const { fiscal_year, settlement_month, current_period, bank_balance, notes } = body
    console.log('POST body:', body)

    // テスト用：決算情報をクッキーに保存
    const fiscalInfo = {
      id: 'saved',
      company_id: 'default-company',
      fiscal_year: fiscal_year || new Date().getFullYear(),
      settlement_month: settlement_month || 3,
      current_period: current_period || 1,
      bank_balance: bank_balance || 5000000,
      notes: notes || '更新された設定'
    }

    console.log('Setting fiscal info to cookie:', fiscalInfo)

    // クッキーに保存（7日間有効）
    const cookieStore = await cookies()
    cookieStore.set('fiscal-info', JSON.stringify(fiscalInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7日間
    })

    console.log('Cookie set successfully')
    return NextResponse.json({
      fiscalInfo,
      message: '決算情報を更新しました'
    }, { status: 200 })
  } catch (error) {
    console.error('POST: 決算情報保存エラー:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // POSTと同じ処理
  return POST(request)
}
