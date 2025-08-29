import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fiscalYear = parseInt(searchParams.get('fiscal_year') || new Date().getFullYear().toString())
    const months = parseInt(searchParams.get('months') || '12')

    // 決算月（デフォルト3月）
    const settlementMonth = 3
    const currentBalance = 5000000

    // 簡略化された予測データを生成
    const predictions = []
    for (let i = 0; i < months; i++) {
      const predictionDate = new Date(fiscalYear, settlementMonth + i, 1)
      const baseInflow = 15000000 + Math.random() * 5000000
      const baseOutflow = 12000000 + Math.random() * 4000000

      predictions.push({
        date: predictionDate.toISOString().split('T')[0],
        predicted_inflow: Math.round(baseInflow),
        predicted_outflow: Math.round(baseOutflow),
        predicted_balance: Math.round(baseInflow - baseOutflow),
        confidence_score: 0.8 + Math.random() * 0.15,
        risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        factors: {
          seasonal_trend: 1.0,
          historical_pattern: 1.0,
          project_cycle: 0.8,
          market_conditions: 1.0
        },
        recommendations: ['安定したキャッシュフローを維持してください']
      })
    }

    return NextResponse.json({
      fiscal_year: fiscalYear,
      settlement_month: settlementMonth,
      note: `決算月: ${settlementMonth}月、予測開始: ${settlementMonth + 1}月`,
      predictions,
      summary: {
        total_predicted_inflow: Math.round(predictions.reduce((sum, p) => sum + p.predicted_inflow, 0)),
        total_predicted_outflow: Math.round(predictions.reduce((sum, p) => sum + p.predicted_outflow, 0)),
        net_cash_flow: Math.round(predictions.reduce((sum, p) => sum + (p.predicted_inflow - p.predicted_outflow), 0)),
        average_balance: Math.round(predictions.reduce((sum, p) => sum + p.predicted_balance, 0) / predictions.length),
        minimum_balance: Math.min(...predictions.map(p => p.predicted_balance)),
        maximum_balance: Math.max(...predictions.map(p => p.predicted_balance)),
        high_risk_months: predictions.filter(p => p.risk_level === 'high').length,
        average_confidence: Math.round(predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length * 100) / 100
      }
    })

  } catch (error) {
    console.error('キャッシュフロー予測エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}