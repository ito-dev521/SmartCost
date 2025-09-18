import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

// ユーザー作成メールのHTML生成
function generateUserEmailHTML(name: string, email: string, password: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>アカウント作成完了のお知らせ</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">SmartCost アカウント作成完了</h2>
        <p>${name} 様</p>
        <p>SmartCostシステムにアカウントが作成されました。</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">ログイン情報</h3>
          <p><strong>メールアドレス:</strong> ${email}</p>
          <p><strong>パスワード:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
        </div>
        
        <p>初回ログイン後、セキュリティのためパスワードの変更をお勧めします。</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            このメールは自動送信されています。ご不明な点がございましたら、システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ユーザー作成メールのテキスト生成
function generateUserEmailText(name: string, email: string, password: string): string {
  return `
SmartCost アカウント作成完了

${name} 様

SmartCostシステムにアカウントが作成されました。

ログイン情報:
メールアドレス: ${email}
パスワード: ${password}

初回ログイン後、セキュリティのためパスワードの変更をお勧めします。

このメールは自動送信されています。ご不明な点がございましたら、システム管理者にお問い合わせください。
  `
}

// メール送信関数（Mailgun使用）
async function sendUserCreationEmail(email: string, name: string, password: string) {
  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY
    const mailgunDomain = process.env.MAILGUN_DOMAIN
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${mailgunDomain}`
    const fromName = process.env.MAILGUN_FROM_NAME || 'SmartCost System'
    
    console.log('🔍 ユーザー作成メール送信開始:', {
      email,
      name,
      hasPassword: !!password,
      mailgunDomain: mailgunDomain ? '設定済み' : '未設定',
      mailgunApiKey: mailgunApiKey ? '設定済み' : '未設定'
    })
    
    if (!mailgunApiKey || !mailgunDomain) {
      console.log('⚠️ Mailgun設定が不完全です。ログ出力のみ行います。')
      console.log('【ユーザー作成メール送信（ログのみ）】')
      console.log('宛先:', email)
      console.log('件名: アカウント作成完了のお知らせ')
      console.log('名前:', name)
      console.log('パスワード:', password)
      return { success: true, method: 'log' }
    }

    // Mailgun APIを使用してメール送信
    const formData = new URLSearchParams()
    formData.append('from', `${fromName} <${fromEmail}>`)
    formData.append('to', email)
    formData.append('subject', 'アカウント作成完了のお知らせ')
    formData.append('html', generateUserEmailHTML(name, email, password))
    formData.append('text', generateUserEmailText(name, email, password))

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ ユーザー作成メール送信成功:', result)
      return { success: true, method: 'mailgun', messageId: result.id }
    } else {
      const errorData = await response.text()
      console.error('❌ ユーザー作成メール送信失敗:', response.status, response.statusText)
      console.error('❌ エラー詳細:', errorData)
      return { success: false, error: errorData, method: 'mailgun' }
    }
    
  } catch (error) {
    console.error('❌ ユーザー作成メール送信エラー:', error)
    return { success: false, error, method: 'mailgun' }
  }
}

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

    // パスワードを自動生成
    const generatePassword = (): string => {
      const length = 12
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      let password = ''
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
      }
      return password
    }
    
    const generatedPassword = generatePassword()
    
    console.log('🔍 /api/admin/register: 認証ユーザー作成開始', {
      email,
      hasPassword: !!generatedPassword,
      passwordLength: generatedPassword.length
    })
    
    // Supabaseの認証システムでユーザーを作成
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('❌ /api/admin/register: 認証ユーザー作成エラー:', {
        error: authError,
        message: authError.message,
        status: (authError as any).status,
      })
      return NextResponse.json(
        { error: `認証ユーザーの作成に失敗しました: ${authError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ /api/admin/register: 認証ユーザー作成成功:', authUser.user.id)

    // カスタムユーザーテーブルにユーザー情報を保存
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id, // Supabaseの認証ユーザーIDを使用
        email,
        name,
        role,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('User table creation error:', insertError)
      // 認証ユーザーは作成されているので、削除を試行
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
      } catch (deleteError) {
        console.error('Failed to delete auth user after table error:', deleteError)
      }
      return NextResponse.json(
        { error: 'ユーザーテーブルの作成に失敗しました' },
        { status: 500 }
      )
    }

    // メール送信を試行
    try {
      await sendUserCreationEmail(email, name, generatedPassword)
    } catch (emailError) {
      console.error('❌ メール送信エラー:', emailError)
      // メール送信に失敗してもユーザー作成は成功とする
    }

    return NextResponse.json({
      message: 'ユーザーが正常に作成されました',
      user: newUser,
      password: generatedPassword // 生成されたパスワードを返す
    })

  } catch (error) {
    console.error('管理者登録エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}




