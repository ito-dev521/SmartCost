#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addItoSuperAdmin() {
  const email = 'ito@ii-stylelab.com'

  try {
    console.log('🔧 ito@ii-stylelab.com をスーパー管理者として登録中...')

    // 1. 現在のRLS状態を確認
    console.log('\n📋 現在のsuper_adminsテーブル状態:')
    const { data: existingAdmins, error: checkError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)

    if (checkError) {
      console.error('❌ 既存レコード確認エラー:', checkError.message)
    } else if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ 既にレコードが存在します:', existingAdmins[0])
      return
    } else {
      console.log('❌ レコードなし、新しく作成します')
    }

    // 2. RLSを一時的に無効化
    console.log('\n🔄 RLSを一時的に無効化...')
    await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY"
    })
    console.log('✅ RLS無効化完了')

    // 3. ito@ii-stylelab.com をスーパー管理者として登録
    console.log('\n📝 スーパー管理者レコード作成...')
    const { data: newRecord, error: insertError } = await supabase
      .from('super_admins')
      .insert([{
        email: email,
        name: 'ITO (スーパー管理者)',
        password_hash: '$2b$10$demo.hash.for.super.admin.only',
        is_active: true
      }])
      .select()

    if (insertError) {
      console.error('❌ レコード作成エラー:', insertError.message)
    } else {
      console.log('✅ スーパー管理者レコード作成成功:', newRecord)
    }

    // 4. RLSを再有効化
    await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY"
    })
    console.log('✅ RLS再有効化完了')

    // 5. 最終確認
    console.log('\n🔍 最終確認:')
    const { data: finalRecord, error: finalError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .single()

    if (finalError) {
      console.error('❌ 最終確認エラー:', finalError.message)
    } else if (finalRecord) {
      console.log('✅ スーパー管理者レコード確認:')
      console.log('   メール:', finalRecord.email)
      console.log('   名前:', finalRecord.name)
      console.log('   アクティブ:', finalRecord.is_active)
      console.log('   作成日:', finalRecord.created_at)
    } else {
      console.log('❌ レコードが見つかりません')
    }

    console.log('\n🎉 登録完了！')
    console.log('\n📋 テスト手順:')
    console.log('1. http://localhost:3000/login にアクセス')
    console.log('2. メール: ito@ii-stylelab.com')
    console.log('3. パスワード: (ご使用のパスワード)')
    console.log('4. http://localhost:3000/super-admin にアクセス')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  addItoSuperAdmin()
}

module.exports = { addItoSuperAdmin }
