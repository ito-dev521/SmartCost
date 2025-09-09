import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/analytics/progress-cost: 工事進行基準原価分析データ取得開始')
    
    // 認証チェック
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // セッションを取得して認証状態を確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ /api/analytics/progress-cost: セッション取得エラー:', sessionError)
      return NextResponse.json({ 
        error: 'セッションの取得に失敗しました。ページを再読み込みしてください。', 
        details: sessionError.message 
      }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ /api/analytics/progress-cost: セッションが存在しません')
      return NextResponse.json({ 
        error: 'ログインが必要です。ログインページで認証してください。' 
      }, { status: 401 })
    }
    
    const user = session.user
    if (!user) {
      console.error('❌ /api/analytics/progress-cost: ユーザー情報が取得できません')
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました。再ログインしてください。' 
      }, { status: 401 })
    }

    console.log('👤 /api/analytics/progress-cost: 認証済みユーザー:', user.id)

    // ユーザーの会社IDを取得
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData) {
      console.error('❌ /api/analytics/progress-cost: ユーザー会社ID取得エラー:', userDataError)
      return NextResponse.json({ 
        error: '会社情報の取得に失敗しました' 
      }, { status: 500 })
    }

    const companyId = userData.company_id
    console.log('🏢 /api/analytics/progress-cost: 会社ID:', companyId)

    // プロジェクトデータを取得（CADDONシステムを除外）
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('business_number')

    if (projectsError) {
      console.error('❌ /api/analytics/progress-cost: プロジェクト取得エラー:', projectsError)
      return NextResponse.json({ 
        error: 'プロジェクトデータの取得に失敗しました' 
      }, { status: 500 })
    }

    // CADDONシステムのプロジェクトを除外
    const projects = allProjects?.filter(project => {
      const isCaddonSystem = (
        (project.business_number && project.business_number.startsWith('C')) ||
        (project.name && project.name.includes('CADDON'))
      )
      return !isCaddonSystem
    }) || []

    console.log('📊 /api/analytics/progress-cost: 全プロジェクト数:', allProjects?.length || 0)
    console.log('📊 /api/analytics/progress-cost: CADDON除外後プロジェクト数:', projects.length)

    // 進捗データを取得（CADDONシステムのプロジェクトを除外）
    const { data: allProgressData, error: progressError } = await supabase
      .from('project_progress')
      .select('*')
      .eq('company_id', companyId)
      .order('progress_date', { ascending: false })

    if (progressError) {
      console.error('❌ /api/analytics/progress-cost: 進捗データ取得エラー:', progressError)
      return NextResponse.json({ 
        error: '進捗データの取得に失敗しました' 
      }, { status: 500 })
    }

    // CADDONシステムのプロジェクトに関連する進捗データを除外
    const progressData = allProgressData?.filter(progress => {
      const project = allProjects?.find(p => p.id === progress.project_id)
      if (!project) return false
      
      const isCaddonSystem = (
        (project.business_number && project.business_number.startsWith('C')) ||
        (project.name && project.name.includes('CADDON'))
      )
      return !isCaddonSystem
    }) || []

    console.log('📈 /api/analytics/progress-cost: 全進捗レコード数:', allProgressData?.length || 0)
    console.log('📈 /api/analytics/progress-cost: CADDON除外後進捗レコード数:', progressData.length)

    // 原価データを取得（CADDONシステムのプロジェクトを除外）
    const { data: allCostData, error: costError } = await supabase
      .from('cost_entries')
      .select('*')
      .eq('company_id', companyId)

    if (costError) {
      console.error('❌ /api/analytics/progress-cost: 原価データ取得エラー:', costError)
      return NextResponse.json({ 
        error: '原価データの取得に失敗しました' 
      }, { status: 500 })
    }

    // CADDONシステムのプロジェクトに関連する原価データを除外
    const costData = allCostData?.filter(cost => {
      if (!cost.project_id) return true // プロジェクトに関連しない原価は含める
      
      const project = allProjects?.find(p => p.id === cost.project_id)
      if (!project) return false
      
      const isCaddonSystem = (
        (project.business_number && project.business_number.startsWith('C')) ||
        (project.name && project.name.includes('CADDON'))
      )
      return !isCaddonSystem
    }) || []

    console.log('💰 /api/analytics/progress-cost: 全原価レコード数:', allCostData?.length || 0)
    console.log('💰 /api/analytics/progress-cost: CADDON除外後原価レコード数:', costData.length)

    // 予算科目データを取得
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('company_id', companyId)

    if (categoriesError) {
      console.error('❌ /api/analytics/progress-cost: 予算科目データ取得エラー:', categoriesError)
      return NextResponse.json({ 
        error: '予算科目データの取得に失敗しました' 
      }, { status: 500 })
    }

    console.log('📋 /api/analytics/progress-cost: 予算科目数:', categories?.length || 0)

    // データを統合・分析
    const analysisData = projects?.map(project => {
      // 最新の進捗データを取得
      const projectProgress = progressData?.filter(p => p.project_id === project.id) || []
      const latestProgress = projectProgress.length > 0 ? projectProgress[0] : null

      // プロジェクトの原価データを取得
      const projectCosts = costData?.filter(c => c.project_id === project.id) || []
      const totalCost = projectCosts.reduce((sum, cost) => sum + cost.amount, 0)

      // カテゴリ別原価を集計
      const costByCategory: { [categoryId: string]: { name: string; amount: number } } = {}
      projectCosts.forEach(cost => {
        const category = categories?.find(c => c.id === cost.category_id)
        if (category) {
          if (!costByCategory[cost.category_id]) {
            costByCategory[cost.category_id] = { name: category.name, amount: 0 }
          }
          costByCategory[cost.category_id].amount += cost.amount
        }
      })

      // 工事進行基準での収益認識
      const contractAmount = project.contract_amount || 0
      const progressRate = latestProgress?.progress_rate || 0
      const recognizedRevenue = (contractAmount * progressRate) / 100

      // 利益計算
      const profit = recognizedRevenue - totalCost
      const profitMargin = recognizedRevenue > 0 ? (profit / recognizedRevenue) * 100 : 0

      // 原価効率（進捗率に対する原価の効率性）
      const costEfficiency = progressRate > 0 ? (totalCost / progressRate) * 100 : 0

      return {
        project: {
          id: project.id,
          name: project.name,
          business_number: project.business_number,
          status: project.status,
          contract_amount: project.contract_amount,
          start_date: project.start_date,
          end_date: project.end_date,
          client_name: project.client_name,
          company_id: project.company_id
        },
        latestProgress: latestProgress ? {
          id: latestProgress.id,
          project_id: latestProgress.project_id,
          progress_rate: latestProgress.progress_rate,
          progress_date: latestProgress.progress_date,
          notes: latestProgress.notes,
          created_at: latestProgress.created_at,
          company_id: latestProgress.company_id
        } : null,
        totalCost,
        costByCategory,
        contractAmount,
        recognizedRevenue,
        profit,
        profitMargin,
        costEfficiency
      }
    }) || []

    console.log('✅ /api/analytics/progress-cost: 分析データ生成完了:', analysisData.length, '件')

    return NextResponse.json({
      success: true,
      data: analysisData
    })

  } catch (error) {
    console.error('❌ /api/analytics/progress-cost: 予期しないエラー:', error)
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
