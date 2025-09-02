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

// メール送信関数（実運用では外部メールサービスを利用）
async function sendCompanyCreationEmail(email: string, companyName: string, password: string) {
  try {
    // 実運用では外部メールサービス（SendGrid、Mailgun等）を使用
    // ここではログ出力のみ行います
    console.log('【法人作成メール送信】')
    console.log('宛先:', email)
    console.log('件名: 法人アカウント作成完了のお知らせ')
    console.log('会社名:', companyName)
    console.log('パスワード:', password)
    
    return { success: true }
  } catch (error) {
    console.error('メール送信エラー:', error)
    return { success: false, error }
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
















