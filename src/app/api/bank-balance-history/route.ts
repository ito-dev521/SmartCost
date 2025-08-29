import { NextRequest, NextResponse } from 'next/server'

// GET: 銀行残高履歴を取得
export async function GET(request: NextRequest) {
  try {
    // テスト用の銀行残高履歴データを返す
    const currentYear = new Date().getFullYear()
    const mockHistory = [
      {
        id: '1',
        fiscal_year: currentYear,
        balance_date: `${currentYear}-01-31`,
        opening_balance: 10000000,
        closing_balance: 12000000,
        total_income: 3500000,
        total_expense: 1500000,
        transaction_count: 45
      },
      {
        id: '2',
        fiscal_year: currentYear,
        balance_date: `${currentYear}-02-28`,
        opening_balance: 12000000,
        closing_balance: 11800000,
        total_income: 2800000,
        total_expense: 3200000,
        transaction_count: 38
      },
      {
        id: '3',
        fiscal_year: currentYear,
        balance_date: `${currentYear}-03-31`,
        opening_balance: 11800000,
        closing_balance: 12500000,
        total_income: 4200000,
        total_expense: 3500000,
        transaction_count: 52
      }
    ]

    return NextResponse.json({
      history: mockHistory,
      total: mockHistory.length
    })

  } catch (error) {
    console.error('銀行残高履歴APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい銀行残高履歴を作成（テスト用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return NextResponse.json({
      message: '銀行残高履歴を作成しました（テストモード）',
      history: { ...body, id: 'test-' + Date.now() }
    })

  } catch (error) {
    console.error('銀行残高履歴作成APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
