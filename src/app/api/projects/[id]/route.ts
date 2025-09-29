import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const supabase = createClient()

    const { id } = await params

    // プロジェクトを取得
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ /api/projects/[id] GET: プロジェクト取得エラー:', error)
      return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const supabase = createClient()

    const { id } = await params
    const body = await request.json()

    const {
      name,
      business_number,
      order_form_name,
      client_id,
      client_name,
      person_in_charge,
      contract_amount,
      start_date,
      end_date,
      status
    } = body

    // バリデーション
                if (!name || !business_number || !client_id || !start_date || !end_date) {
              return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 })
            }

            // 業務番号の重複チェック（自分自身は除外）
            const { data: existingProject, error: checkError } = await supabase
              .from('projects')
              .select('id, name')
              .eq('business_number', business_number.trim())
              .neq('id', id)
              .single()

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116は「データが見つからない」エラー
              console.error('❌ /api/projects/[id] PUT: 重複チェックエラー:', checkError)
              return NextResponse.json({ error: '業務番号の重複チェックに失敗しました' }, { status: 500 })
            }

            if (existingProject) {
              return NextResponse.json({ 
                error: `業務番号「${business_number}」は既に使用されています（プロジェクト: ${existingProject.name}）` 
              }, { status: 400 })
            }

    // プロジェクトデータを準備
    const projectData = {
      name: name.trim(),
      business_number: business_number.trim(),
      order_form_name: order_form_name ? order_form_name.trim() : null,
      client_id,
      client_name,
      person_in_charge: person_in_charge ? person_in_charge.trim() : null,
      contract_amount: contract_amount || 0,
      start_date,
      end_date,
      status: status || 'planning',
      updated_at: new Date().toISOString()
    }


    // プロジェクトを更新
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ /api/projects/[id] PUT: プロジェクト更新エラー:', error)
      return NextResponse.json({ error: 'プロジェクトの更新に失敗しました' }, { status: 500 })
    }

    // ステータスが完了になった場合は進捗率100%を自動記録
    if (status === 'completed') {
      try {
        // 簡易UUID生成（認証未接続環境向けの暫定対応）
        const generateUUID = () =>
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
          })

        // 既に100%が記録されているか確認
        const { data: latest } = await supabase
          .from('project_progress')
          .select('*')
          .eq('project_id', id)
          .order('progress_date', { ascending: false })
          .limit(1)

        const latestRate = latest && latest.length > 0 ? (latest[0].progress_rate || 0) : 0
        if (latestRate < 100) {
          const today = new Date().toISOString().split('T')[0]
          const { error: insertError } = await supabase
            .from('project_progress')
            .insert({
              project_id: id,
              progress_rate: 100,
              progress_date: today,
              created_by: generateUUID(),
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            console.error('progress 100% 自動登録エラー:', insertError)
          }
        }
      } catch (e) {
        console.error('進捗100%の自動記録に失敗:', e)
      }
    }

    return NextResponse.json({ project: data })
  } catch (error) {
    console.error('プロジェクト更新エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const supabase = createClient()

    const { id } = await params

    // プロジェクトを削除
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ /api/projects/[id] DELETE: プロジェクト削除エラー:', error)
      return NextResponse.json({ error: 'プロジェクトの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: 'プロジェクトが削除されました' })
  } catch (error) {
    console.error('プロジェクト削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
