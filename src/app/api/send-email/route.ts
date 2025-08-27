import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // Supabaseクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // メール送信（Supabaseのメール機能を使用）
    const { data, error } = await supabase.auth.admin.sendRawEmail({
      to: email,
      subject: 'アカウント作成完了のお知らせ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            アカウント作成完了のお知らせ
          </h2>
          
          <p>${name} 様</p>
          
          <p>建設原価管理システムのアカウントが作成されました。</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">ログイン情報</h3>
            <p><strong>メールアドレス:</strong> ${email}</p>
            <p><strong>パスワード:</strong> <span style="font-family: monospace; background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ セキュリティ上の注意:</strong><br>
              初回ログイン後、必ずパスワードを変更してください。
            </p>
          </div>
          
          <p>ログインは以下のURLから行ってください：</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" style="color: #2563eb; text-decoration: none;">ログインページ</a></p>
          
          <p>ご不明な点がございましたら、システム管理者までお問い合わせください。</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            このメールは自動送信されています。返信はできません。
          </p>
        </div>
      `,
      text: `
アカウント作成完了のお知らせ

${name} 様

建設原価管理システムのアカウントが作成されました。

ログイン情報:
メールアドレス: ${email}
パスワード: ${password}

⚠️ セキュリティ上の注意:
初回ログイン後、必ずパスワードを変更してください。

ログインは以下のURLから行ってください：
${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login

ご不明な点がございましたら、システム管理者までお問い合わせください。

---
このメールは自動送信されています。返信はできません。
      `
    })

    if (error) {
      console.error('メール送信エラー:', error)
      return NextResponse.json(
        { error: 'メールの送信に失敗しました' },
        { status: 500 }
      )
    }

    console.log('✅ メール送信成功:', email)
    return NextResponse.json({
      message: 'メールが正常に送信されました',
      email
    })

  } catch (error) {
    console.error('メール送信APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}





