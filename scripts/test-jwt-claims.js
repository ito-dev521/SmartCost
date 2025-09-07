#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testJWTClaims() {
  try {
    console.log('🔍 JWT Custom Claims テストを開始...')

    // テスト用ユーザーでログイン（実際のユーザー情報を使用）
    const email = 'ito.dev@ii-stylelab.com' // 実際のメールアドレスに変更
    const password = 'your_password' // 実際のパスワードに変更

    console.log('⚠️ このスクリプトは実際のログイン認証情報が必要です')
    console.log('   email/passwordを設定してから実行してください')
    
    // ログイン試行（認証情報が正しく設定されている場合）
    // const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    //   email,
    //   password
    // })

    // if (authError) {
    //   console.error('❌ ログインエラー:', authError.message)
    //   return
    // }

    // console.log('✅ ログイン成功')
    
    // // 現在のセッション取得
    // const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // if (sessionError || !session) {
    //   console.error('❌ セッション取得エラー:', sessionError?.message)
    //   return
    // }

    // console.log('📋 JWTトークン情報:')
    // console.log('   アクセストークン長:', session.access_token.length)
    
    // // JWTペイロードをデコード
    // const payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString())
    
    // console.log('📋 JWTペイロード内容:')
    // console.log('   ユーザーID:', payload.sub)
    // console.log('   メールアドレス:', payload.email)
    // console.log('   Company ID:', payload.company_id || '❌ 未設定')
    // console.log('   User Role:', payload.user_role || '❌ 未設定')
    
    // if (payload.company_id && payload.user_role) {
    //   console.log('✅ JWT Custom Claims が正常に動作しています！')
    // } else {
    //   console.log('❌ JWT Custom Claims が設定されていません')
    //   console.log('   以下を確認してください：')
    //   console.log('   1. ログアウト・ログインを実行したか')
    //   console.log('   2. Supabaseでhookが有効になっているか')
    //   console.log('   3. usersテーブルにcompany_idとroleが設定されているか')
    // }

  } catch (error) {
    console.error('❌ テストエラー:', error.message)
  }
}

// 使用方法を表示
console.log('🔧 JWT Custom Claims テストスクリプト')
console.log('使用方法:')
console.log('1. このファイルの email/password を実際の値に変更')
console.log('2. コメントアウトを解除')
console.log('3. npm test-jwt-claims または node scripts/test-jwt-claims.js で実行')
console.log('')

if (require.main === module) {
  testJWTClaims()
}

