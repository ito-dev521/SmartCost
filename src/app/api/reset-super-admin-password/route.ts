import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'メールアドレスと新しいパスワードが必要です' },
        { status: 400 }
      )
    }

    const supabase = createServerComponentClient()

    // パスワードリセット用のメールを送信
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })

    if (resetError) {
      console.error('パスワードリセットエラー:', resetError)
      return NextResponse.json(
        { error: 'パスワードリセットメール送信に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました',
      email: email
    })

  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// GETメソッドで現在のスーパー管理者を確認
export async function GET() {
  try {
    const supabase = createServerComponentClient()

    const { data: superAdmins, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('スーパー管理者取得エラー:', error)
      return NextResponse.json(
        { error: 'スーパー管理者情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      superAdmins: superAdmins || []
    })

  } catch (error) {
    console.error('スーパー管理者取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}













