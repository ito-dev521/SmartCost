import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証チェック（クッキーまたはBearerトークン）
    let user: { id?: string } | null = null
    let authError = null
    
    // まずクッキーでの認証を試行
    const { data: cookieUser, error: cookieError } = await supabase.auth.getUser()
    if (cookieUser?.user && !cookieError) {
      user = { id: cookieUser.user.id }
    } else {
      // Bearerトークンでの認証を試行
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: tokenUser, error: tokenError } = await supabase.auth.getUser(token)
        if (tokenUser?.user && !tokenError) {
          user = { id: tokenUser.user.id }
        } else {
          authError = tokenError
        }
      } else {
        authError = new Error('認証情報がありません')
      }
    }
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { projectId, monthlyData } = await request.json()

    // 既存の分割入金データを削除
    const { error: deleteError } = await supabase
      .from('split_billing')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('分割入金データ削除エラー:', deleteError)
      return NextResponse.json({ error: '分割入金データの削除に失敗しました' }, { status: 500 })
    }

    // 新しい分割入金データを挿入
    const splitBillingData = Object.entries(monthlyData).map(([month, amount]) => ({
      project_id: projectId,
      billing_month: month,
      amount: amount as number,
      created_by: user?.id || null,
      created_at: new Date().toISOString()
    }))

    if (splitBillingData.length > 0) {
      const { error: insertError } = await supabase
        .from('split_billing')
        .insert(splitBillingData)

      if (insertError) {
        console.error('分割入金データ挿入エラー:', insertError)
        return NextResponse.json({ error: '分割入金データの保存に失敗しました' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('分割入金保存エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証チェック（クッキーまたはBearerトークン）
    let user = null
    let authError = null
    
    // まずクッキーでの認証を試行
    const { data: cookieUser, error: cookieError } = await supabase.auth.getUser()
    if (cookieUser && !cookieError) {
      user = cookieUser
    } else {
      // Bearerトークンでの認証を試行
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: tokenUser, error: tokenError } = await supabase.auth.getUser(token)
        if (tokenUser && !tokenError) {
          user = tokenUser
        } else {
          authError = tokenError
        }
      } else {
        authError = new Error('認証情報がありません')
      }
    }
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const allProjects = searchParams.get('allProjects')

    if (allProjects === 'true') {
      // 全プロジェクトの分割入金データを一括取得
      const { data, error } = await supabase
        .from('split_billing')
        .select('project_id, billing_month, amount')
        .order('project_id, billing_month')

      if (error) {
        console.error('分割入金データ一括取得エラー:', error)
        return NextResponse.json({ error: '分割入金データの取得に失敗しました' }, { status: 500 })
      }

      // プロジェクト別に月次データをグループ化
      const projectData: { [projectId: string]: { [month: string]: number } } = {}
      data?.forEach(item => {
        if (!projectData[item.project_id]) {
          projectData[item.project_id] = {}
        }
        projectData[item.project_id][item.billing_month] = item.amount
      })

      return NextResponse.json({ projectData })
    } else if (projectId) {
      // 単一プロジェクトの分割入金データを取得
      const { data, error } = await supabase
        .from('split_billing')
        .select('billing_month, amount')
        .eq('project_id', projectId)
        .order('billing_month')

      if (error) {
        console.error('分割入金データ取得エラー:', error)
        return NextResponse.json({ error: '分割入金データの取得に失敗しました' }, { status: 500 })
      }

      // 月別データをオブジェクトに変換
      const monthlyData: { [key: string]: number } = {}
      data?.forEach(item => {
        monthlyData[item.billing_month] = item.amount
      })

      return NextResponse.json({ monthlyData })
    } else {
      return NextResponse.json({ error: 'プロジェクトIDまたはallProjectsパラメータが必要です' }, { status: 400 })
    }
  } catch (error) {
    console.error('分割入金取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
