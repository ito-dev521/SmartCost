import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // AuthorizationヘッダーからJWTトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ /api/users/[id]: 認証ヘッダーなし')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let userId: string | null = null

    try {
      // JWTデコード（簡易版）
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      userId = payload.sub
    } catch (error) {
      console.error('❌ /api/users/[id]: JWTデコードエラー:', error)
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      )
    }

    // Supabaseクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 削除を実行するユーザーの権限を確認
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single()

    if (userError || !currentUser) {
      console.error('❌ /api/users/[id]: 現在のユーザーデータ取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザーデータが見つかりません' },
        { status: 404 }
      )
    }

    // 管理者権限チェック
    if (currentUser.role !== 'admin') {
      console.error('❌ /api/users/[id]: 管理者権限なし', { userId, role: currentUser.role })
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    // 削除対象のユーザー情報を取得
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (targetError || !targetUser) {
      console.error('❌ /api/users/[id]: 削除対象ユーザーが見つかりません:', targetError)
      return NextResponse.json(
        { error: '削除対象のユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 自分自身を削除しようとしている場合は拒否
    if (targetUser.id === userId) {
      console.error('❌ /api/users/[id]: 自分自身の削除を試行:', userId)
      return NextResponse.json(
        { error: '自分自身のアカウントは削除できません' },
        { status: 400 }
      )
    }

    // 同じ会社のユーザーかチェック
    if (targetUser.company_id !== currentUser.company_id) {
      console.error('❌ /api/users/[id]: 異なる会社のユーザー削除を試行:', {
        targetCompany: targetUser.company_id,
        currentCompany: currentUser.company_id
      })
      return NextResponse.json(
        { error: '異なる会社のユーザーは削除できません' },
        { status: 403 }
      )
    }


    // トランザクション開始
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ /api/users/[id]: ユーザーテーブル削除エラー:', deleteError)
      return NextResponse.json(
        { error: 'ユーザーの削除に失敗しました' },
        { status: 500 }
      )
    }

    // Supabaseの認証システムからもユーザーを削除
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)
      if (authDeleteError) {
        console.warn('⚠️ /api/users/[id]: 認証ユーザー削除エラー（テーブルは削除済み）:', authDeleteError)
        // 認証ユーザーの削除に失敗しても、テーブルは削除されているので警告のみ
      } else {
      }
    } catch (authError) {
      console.warn('⚠️ /api/users/[id]: 認証ユーザー削除で例外発生（テーブルは削除済み）:', authError)
    }

    return NextResponse.json({
      message: 'ユーザーが正常に削除されました',
      deletedUserId: id
    })

  } catch (error) {
    console.error('❌ /api/users/[id]: 削除処理エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}











