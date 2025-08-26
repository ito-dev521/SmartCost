import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // ユーザーの認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, progress_rate, progress_date, notes } = body

    // 必須フィールドの検証
    if (!project_id || progress_rate === undefined || !progress_date) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 })
    }

    // 進捗率の範囲チェック
    if (progress_rate < 0 || progress_rate > 100) {
      return NextResponse.json({ error: '進捗率は0-100の範囲で入力してください' }, { status: 400 })
    }

    // 進捗データを保存
    const { data, error } = await supabase
      .from('project_progress')
      .insert({
        project_id,
        progress_rate,
        progress_date,
        notes: notes || null,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('進捗データ保存エラー:', error)
      return NextResponse.json({ error: '進捗データの保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: '進捗が正常に記録されました'
    })

  } catch (error) {
    console.error('進捗記録エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // ユーザーの認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')

    let query = supabase
      .from('project_progress')
      .select(`
        *,
        projects (
          id,
          name,
          business_number
        )
      `)
      .order('progress_date', { ascending: false })

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('進捗データ取得エラー:', error)
      return NextResponse.json({ error: '進捗データの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('進捗データ取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
