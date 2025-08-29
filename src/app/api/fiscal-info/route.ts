import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // テスト用の決算情報を返す
    const defaultFiscalInfo = {
      id: 'default',
      company_id: 'default-company',
      fiscal_year: new Date().getFullYear(),
      settlement_month: 3,
      current_period: 1,
      bank_balance: 5000000,
      notes: 'デフォルト設定'
    }

    return NextResponse.json({ fiscalInfo: defaultFiscalInfo })
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
    const body = await request.json()
    const { fiscal_year, settlement_month, current_period, bank_balance, notes } = body

    // テスト用の応答を返す
    const updatedFiscalInfo = {
      id: 'updated',
      company_id: 'default-company',
      fiscal_year: fiscal_year || new Date().getFullYear(),
      settlement_month: settlement_month || 3,
      current_period: current_period || 1,
      bank_balance: bank_balance || 5000000,
      notes: notes || '更新された設定'
    }

    return NextResponse.json({
      fiscalInfo: updatedFiscalInfo,
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
