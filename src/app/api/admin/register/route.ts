import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()

    // 現在のユーザーが認証されているか確認
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 現在のユーザーが管理者かどうか確認
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const { email, name, role = 'user' } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと名前は必須です' },
        { status: 400 }
      )
    }

    // ユーザーが既に存在するか確認
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスのユーザーは既に存在します' },
        { status: 400 }
      )
    }

    // 新しいユーザーを作成
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        role,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('ユーザー作成エラー:', insertError)
      return NextResponse.json(
        { error: 'ユーザーの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ユーザーが正常に作成されました',
      user: newUser
    })

  } catch (error) {
    console.error('管理者登録エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}




