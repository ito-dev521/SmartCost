import { NextRequest, NextResponse } from 'next/server'

interface CashFlowPrediction {
  date: string
  predicted_inflow: number
  predicted_outflow: number
  predicted_balance: number
}

interface Project {
  id: string
  name: string
  business_number: string | null
  contract_amount: number | null
  start_date: string | null
  end_date: string | null
  status: string
}

interface AIAnalysisResult {
  riskAnalysis: {
    highRiskPeriods: {
      months: string[]
      riskFactors: string[]
      severity: 'high' | 'medium' | 'low'
      recommendations: string[]
    }
    seasonalRisks: {
      winterRisk: boolean
      yearEndRisk: boolean
      fiscalYearEndRisk: boolean
      riskFactors: string[]
      recommendations: string[]
    }
  }
  growthOpportunities: {
    highGrowthMonths: string[]
    potentialProjects: string[]
    marketTrends: string[]
    recommendations: string[]
  }
  overallAssessment: {
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    summary: string
    keyActions: string[]
  }
}

// 追加: 厳格な型
type Severity = 'low' | 'medium' | 'high'
interface HighRiskPeriods { months: string[]; riskFactors: string[]; severity: Severity; recommendations: string[] }
interface SeasonalRisks { winterRisk: boolean; yearEndRisk: boolean; fiscalYearEndRisk: boolean; riskFactors: string[]; recommendations: string[] }

export async function POST(request: NextRequest) {
  try {

    const { predictions, projects, fiscalInfo } = await request.json()

    if (!predictions || !Array.isArray(predictions)) {
      return NextResponse.json(
        { error: '予測データが必要です' },
        { status: 400 }
      )
    }

    // AI分析の実行
    const analysisResult = await performAIAnalysis(predictions, projects, fiscalInfo)

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('AI分析エラー:', error)
    return NextResponse.json(
      { error: 'AI分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

async function performAIAnalysis(
  predictions: CashFlowPrediction[],
  projects: Project[],
  fiscalInfo: {
    id: string
    fiscal_year: number
    settlement_month: number
    current_period: number
    bank_balance: number
    notes: string | null
  } | null
): Promise<AIAnalysisResult> {
  
  // 高リスク期間の検知
  const highRiskPeriods: HighRiskPeriods = analyzeHighRiskPeriods(predictions)
  
  // 季節性リスクの検知
  const seasonalRisks: SeasonalRisks = analyzeSeasonalRisks(predictions, fiscalInfo)
  
  // 成長機会の検知
  const growthOpportunities = analyzeGrowthOpportunities(predictions, projects)
  
  // 全体的なリスク評価
  const overallAssessment = analyzeOverallRisk(predictions, highRiskPeriods, seasonalRisks)

  return {
    riskAnalysis: {
      highRiskPeriods,
      seasonalRisks
    },
    growthOpportunities,
    overallAssessment
  }
}

function analyzeHighRiskPeriods(predictions: CashFlowPrediction[]): HighRiskPeriods {
  const highRiskMonths: string[] = []
  const riskFactors: string[] = []
  const recommendations: string[] = []

  predictions.forEach((prediction) => {
    const cashFlowRatio = prediction.predicted_outflow / (prediction.predicted_inflow || 1)
    const balanceRisk = prediction.predicted_balance < 1000000

    if (cashFlowRatio > 1.2 || balanceRisk) {
      highRiskMonths.push(prediction.date)
      
      if (cashFlowRatio > 1.2) {
        riskFactors.push(`${prediction.date}: 支出が収入の120%を超過`)
      }
      
      if (balanceRisk) {
        riskFactors.push(`${prediction.date}: 残高が100万円未満`)
      }
    }
  })

  // 推奨事項の生成
  if (highRiskMonths.length > 0) {
    recommendations.push('緊急の資金調達を検討してください')
    recommendations.push('支出削減策の即座の実施が必要です')
    recommendations.push('収入増加のための新規プロジェクト獲得を検討してください')
  }

  return {
    months: highRiskMonths,
    riskFactors,
    severity: highRiskMonths.length > 3 ? 'high' : highRiskMonths.length > 1 ? 'medium' : 'low',
    recommendations
  }
}

function analyzeSeasonalRisks(
  predictions: CashFlowPrediction[], 
  fiscalInfo: {
    id: string
    fiscal_year: number
    settlement_month: number
    current_period: number
    bank_balance: number
    notes: string | null
  } | null
) {
  const winterRisk = predictions.some(p => {
    const month = extractMonth(p.date)
    return (month >= 11 || month <= 2) && p.predicted_outflow > p.predicted_inflow * 1.1
  })

  const yearEndRisk = predictions.some(p => {
    const month = extractMonth(p.date)
    return (month === 12 || month === 1) && p.predicted_outflow > p.predicted_inflow * 1.2
  })

  const fiscalYearEndRisk = predictions.some(p => {
    const month = extractMonth(p.date)
    const settlementMonth = fiscalInfo?.settlement_month || 3
    return month === settlementMonth && p.predicted_outflow > p.predicted_inflow * 1.15
  })

  const riskFactors: string[] = []
  const recommendations: string[] = []

  if (winterRisk) {
    riskFactors.push('冬季（11月〜2月）における支出超過の傾向')
    recommendations.push('冬季の資金需要に備えた事前準備が必要です')
  }

  if (yearEndRisk) {
    riskFactors.push('年末年始における大幅な支出超過')
    recommendations.push('年末年始の支出抑制と早期収入確保を検討してください')
  }

  if (fiscalYearEndRisk) {
    riskFactors.push('決算期における支出集中')
    recommendations.push('決算期の資金繰りを事前に計画してください')
  }

  return {
    winterRisk,
    yearEndRisk,
    fiscalYearEndRisk,
    riskFactors,
    recommendations
  }
}

function analyzeGrowthOpportunities(predictions: CashFlowPrediction[], projects: Project[]) {
  const highGrowthMonths: string[] = []
  const potentialProjects: string[] = []
  const marketTrends: string[] = []
  const recommendations: string[] = []

  // 高成長月の検知
  predictions.forEach(prediction => {
    const growthRate = (prediction.predicted_inflow - prediction.predicted_outflow) / prediction.predicted_outflow
    if (growthRate > 0.3 && prediction.predicted_inflow > 5000000) {
      highGrowthMonths.push(prediction.date)
    }
  })

  // 潜在的なプロジェクト機会の分析
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning')
  if (activeProjects.length > 0) {
    potentialProjects.push(`${activeProjects.length}件の進行中・計画中プロジェクトが存在`)
  }

  // 市場トレンドの分析
  const totalContractValue = projects.reduce((sum, p) => sum + (p.contract_amount || 0), 0)
  if (totalContractValue > 100000000) {
    marketTrends.push('高額プロジェクトの獲得により市場での競争力が向上')
  }

  // 推奨事項の生成
  if (highGrowthMonths.length > 0) {
    recommendations.push('高成長月の資金を活用した投資機会の検討')
    recommendations.push('成長期における人員・設備の拡充計画')
  }

  if (potentialProjects.length > 0) {
    recommendations.push('新規プロジェクトの早期開始による収入増加')
    recommendations.push('既存プロジェクトの効率化による利益率向上')
  }

  return {
    highGrowthMonths,
    potentialProjects,
    marketTrends,
    recommendations
  }
}

function analyzeOverallRisk(
  predictions: CashFlowPrediction[],
  highRiskPeriods: HighRiskPeriods,
  seasonalRisks: SeasonalRisks
) {
  let riskScore = 0

  // リスクスコアの計算
  if (highRiskPeriods.severity === 'high') riskScore += 3
  else if (highRiskPeriods.severity === 'medium') riskScore += 2
  else riskScore += 1

  if (seasonalRisks.winterRisk) riskScore += 1
  if (seasonalRisks.yearEndRisk) riskScore += 1
  if (seasonalRisks.fiscalYearEndRisk) riskScore += 1

  // 全体的なリスクレベルの判定
  let riskLevel: Severity = 'low'
  if (riskScore >= 4) riskLevel = 'high'
  else if (riskScore >= 2) riskLevel = 'medium'

  // 信頼度の計算
  const confidence = Math.max(0.6, 1 - (riskScore * 0.1))

  // サマリーとキーアクションの生成
  let summary = ''
  const keyActions: string[] = []

  if (riskLevel === 'high') {
    summary = '資金管理において高リスクの状況が検知されています。即座の対応が必要です。'
    keyActions.push('緊急資金調達の検討','支出削減の即座実施','収入増加策の検討')
  } else if (riskLevel === 'medium') {
    summary = '資金管理において中程度のリスクが検知されています。注意深い監視が必要です。'
    keyActions.push('月次資金計画の見直し','リスク要因の詳細分析','予防的対策の実施')
  } else {
    summary = '資金管理において安定した状況を維持しています。継続的な監視を推奨します。'
    keyActions.push('定期的な資金状況の確認','成長機会の積極的検討','効率化の継続')
  }

  return {
    riskLevel,
    confidence,
    summary,
    keyActions
  }
}

function extractMonth(dateString: string): number {
  if (dateString.includes('年') && dateString.includes('月')) {
    const monthMatch = dateString.match(/(\d+)月/)
    return monthMatch ? parseInt(monthMatch[1]) : 1
  }
  // 従来の日付形式の場合
  return new Date(dateString).getMonth() + 1
}
