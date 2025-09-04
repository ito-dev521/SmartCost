import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント作成関数
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 環境変数エラー:', {
      supabaseUrl: supabaseUrl ? '設定済み' : '未設定',
      supabaseServiceKey: supabaseServiceKey ? '設定済み' : '未設定'
    })
    throw new Error('Supabase環境変数が設定されていません')
  }
  
  console.log('🔍 Supabase接続情報:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  })
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// データベース接続テスト
async function testDatabaseConnection(supabase: any) {
  try {
    console.log('🔍 データベース接続テスト開始')
    
    // companiesテーブルの存在確認
    const { data: companiesTest, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (companiesError) {
      console.error('❌ companiesテーブル接続エラー:', companiesError)
      throw new Error(`companiesテーブルに接続できません: ${companiesError.message}`)
    }
    
    console.log('✅ companiesテーブル接続成功')
    
    // company_settingsテーブルの存在確認
    const { data: settingsTest, error: settingsError } = await supabase
      .from('company_settings')
      .select('company_id')
      .limit(1)
    
    if (settingsError) {
      console.error('❌ company_settingsテーブル接続エラー:', settingsError)
      console.log('⚠️ company_settingsテーブルが存在しない可能性があります。データベースマイグレーションを実行してください。')
    } else {
      console.log('✅ company_settingsテーブル接続成功')
    }
    
    // usersテーブルの存在確認
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersError) {
      console.error('❌ usersテーブル接続エラー:', usersError)
      throw new Error(`usersテーブルに接続できません: ${usersError.message}`)
    }
    
    console.log('✅ usersテーブル接続成功')
    console.log('✅ データベース接続テスト完了')
    
  } catch (error) {
    console.error('❌ データベース接続テスト失敗:', error)
    throw error
  }
}

// パスワード生成関数
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// HTMLメール本文生成
function generateCompanyEmailHTML(companyName: string, email: string, password: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        法人アカウント作成完了のお知らせ
      </h2>
      
      <p>${companyName} 様</p>
      
      <p>建設原価管理システムの法人アカウントが作成されました。</p>
      
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
  `
}

// テキストメール本文生成
function generateCompanyEmailText(companyName: string, email: string, password: string): string {
  return `
法人アカウント作成完了のお知らせ

${companyName} 様

建設原価管理システムの法人アカウントが作成されました。

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
}

// メール送信関数（Mailgun使用）
async function sendCompanyCreationEmail(email: string, companyName: string, password: string) {
  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY
    const mailgunDomain = process.env.MAILGUN_DOMAIN
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${mailgunDomain}`
    const fromName = process.env.MAILGUN_FROM_NAME || 'SmartCost System'
    
    // 詳細なデバッグ情報を出力
    console.log('🔍 Mailgun設定確認:')
    console.log('  - API Key:', mailgunApiKey ? `key-${mailgunApiKey.substring(0, 8)}...` : '未設定')
    console.log('  - Domain:', mailgunDomain || '未設定')
    console.log('  - From Email:', fromEmail)
    console.log('  - From Name:', fromName)
    
    if (!mailgunApiKey || !mailgunDomain) {
      console.log('⚠️ Mailgun設定が不完全です。ログ出力のみ行います。')
      console.log('【法人作成メール送信（ログのみ）】')
      console.log('宛先:', email)
      console.log('件名: 法人アカウント作成完了のお知らせ')
      console.log('会社名:', companyName)
      console.log('パスワード:', password)
      return { success: true, method: 'log' }
    }

    console.log('🔍 Mailgunメール送信開始')
    console.log('宛先:', email)
    console.log('件名: 法人アカウント作成完了のお知らせ')
    
    // Mailgun APIを使用してメール送信
    const formData = new URLSearchParams()
    formData.append('from', `${fromName} <${fromEmail}>`)
    formData.append('to', email)
    formData.append('subject', '法人アカウント作成完了のお知らせ')
    formData.append('html', generateCompanyEmailHTML(companyName, email, password))
    formData.append('text', generateCompanyEmailText(companyName, email, password))

    console.log('🔍 Mailgun APIリクエスト送信:')
    console.log('  - URL:', `https://api.mailgun.net/v3/${mailgunDomain}/messages`)
    console.log('  - Method: POST')

    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    console.log('🔍 Mailgun APIレスポンス:')
    console.log('  - Status:', response.status)
    console.log('  - Status Text:', response.statusText)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Mailgunメール送信成功:', result)
      return { success: true, method: 'mailgun', messageId: result.id }
    } else {
      const errorData = await response.text()
      console.error('❌ Mailgunメール送信失敗:', response.status, errorData)
      return { success: false, error: errorData, method: 'mailgun' }
    }
    
  } catch (error) {
    console.error('❌ Mailgunメール送信エラー:', error)
    return { success: false, error, method: 'mailgun' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // 法人一覧を取得
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_settings (
          caddon_enabled
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('法人一覧取得エラー:', error)
      return NextResponse.json({ error: '法人一覧の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('法人一覧取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 法人作成API: 開始')
    
    const supabase = createSupabaseClient()
    console.log('✅ Supabaseクライアント作成完了')
    
    // データベース接続テスト
    await testDatabaseConnection(supabase)
    
    const body = await request.json()
    console.log('📋 リクエストボディ:', { name: body.name, email: body.email })
    
    const { name, contact_name, email, address, phone, caddon_enabled } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '法人名は必須です' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '有効なメールアドレスが必要です' }, { status: 400 })
    }

    // 既存の法人メールアドレスチェック
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email)
      .single()

    if (existingCompany) {
      return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 })
    }

    // 法人を作成
    const { data: company, error } = await supabase
      .from('companies')
      .insert([{ 
        name: name.trim(),
        contact_name: contact_name || null,
        email: email || null,
        address: address || null,
        phone: phone || null
      }])
      .select()
      .single()

    if (error) {
      console.error('法人作成エラー:', error)
      return NextResponse.json({ error: '法人の作成に失敗しました' }, { status: 500 })
    }

    // 会社設定（CADDON有効/無効）: 新規はtrueで作成
    if (company?.id) {
      console.log('🔍 CADDON設定保存開始:', { 
        caddon_enabled, 
        type: typeof caddon_enabled,
        isFalse: caddon_enabled === false,
        isTrue: caddon_enabled === true
      })
      
      // caddon_enabledが明示的にfalseの場合はfalse、それ以外はtrue
      const finalCaddonEnabled = caddon_enabled === false ? false : true
      
      const { error: csUpsertError } = await supabase
        .from('company_settings')
        .upsert({ 
          company_id: company.id, 
          caddon_enabled: finalCaddonEnabled
        }, { 
          onConflict: 'company_id' 
        })
        
      if (csUpsertError) {
        console.error('会社設定の作成/更新エラー:', csUpsertError)
        return NextResponse.json({ error: '会社設定の保存に失敗しました。DBマイグレーション（company_settings）を適用してください。' }, { status: 500 })
      }
      
      console.log('✅ CADDON設定保存完了:', finalCaddonEnabled)
    }

    // 法人管理者アカウントを作成
    let adminUser = null
    let generatedPassword = null
    
    if (email && company?.id) {
      try {
        // パスワードを自動生成
        generatedPassword = generatePassword()
        
        // Supabaseの認証システムでユーザーを作成
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: generatedPassword,
          email_confirm: true, // メール確認をスキップ
          user_metadata: {
            name: contact_name || name,
            role: 'admin',
            company_id: company.id
          }
        })

        if (authError) {
          console.error('法人管理者アカウント作成エラー:', authError)
          // アカウント作成に失敗しても法人作成は成功とする
        } else {
          // usersテーブルにユーザー情報を保存
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({
              id: authUser.user.id,
              email,
              name: contact_name || name,
              role: 'admin',
              company_id: company.id,
              created_at: new Date().toISOString()
            })

          if (userInsertError) {
            console.error('ユーザーテーブル保存エラー:', userInsertError)
          } else {
            adminUser = authUser.user
          }
        }
      } catch (userError) {
        console.error('法人管理者アカウント作成エラー:', userError)
      }
    }

    // メール送信
    let emailResult = null
    if (email && generatedPassword) {
      emailResult = await sendCompanyCreationEmail(email, name, generatedPassword)
    }

    return NextResponse.json({ 
      company,
      adminUser: adminUser ? { id: adminUser.id, email: adminUser.email } : null,
      password: generatedPassword,
      emailSent: emailResult?.success || false
    }, { status: 201 })
  } catch (error) {
    console.error('法人作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
















