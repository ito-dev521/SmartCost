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

async function fixSuperAdminTable() {
  const email = 'superadmin@example.com'

  try {
    console.log('🔧 スーパー管理者テーブル修正を開始...')

    // 1. 現在のスーパー管理者レコードを確認
    console.log('\n📋 現在のスーパー管理者レコード:')
    const { data: existingAdmins, error: checkError } = await supabase
      .from('super_admins')
      .select('*')

    if (checkError) {
      console.error('❌ スーパー管理者テーブル確認エラー:', checkError.message)
      return
    }

    console.log('現在のレコード数:', existingAdmins?.length || 0)
    existingAdmins?.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.name}) - アクティブ: ${admin.is_active}`)
    })

    // 2. superadmin@example.com のレコードを確認
    const existingRecord = existingAdmins?.find(admin => admin.email === email)

    if (existingRecord) {
      console.log('\n✅ 既にレコードが存在します')
      if (!existingRecord.is_active) {
        console.log('🔄 アクティブ状態に更新します...')
        const { error: updateError } = await supabase
          .from('super_admins')
          .update({ is_active: true })
          .eq('email', email)

        if (updateError) {
          console.error('❌ 更新エラー:', updateError.message)
        } else {
          console.log('✅ アクティブ状態に更新しました')
        }
      }
    } else {
      console.log('\n📝 新しいスーパー管理者レコードを作成します...')

      const { error: insertError } = await supabase
        .from('super_admins')
        .insert([{
          email: email,
          name: 'スーパー管理者',
          password_hash: '$2b$10$demo.hash.for.super.admin.only',
          is_active: true
        }])

      if (insertError) {
        console.error('❌ 挿入エラー:', insertError.message)

        // 重複エラーの場合は更新を試行
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          console.log('🔄 重複エラーのため更新を試行...')
          const { error: updateError } = await supabase
            .from('super_admins')
            .update({
              name: 'スーパー管理者',
              password_hash: '$2b$10$demo.hash.for.super.admin.only',
              is_active: true
            })
            .eq('email', email)

          if (updateError) {
            console.error('❌ 更新エラー:', updateError.message)
          } else {
            console.log('✅ 重複レコードを更新しました')
          }
        }
      } else {
        console.log('✅ 新しいレコードを作成しました')
      }
    }

    // 3. 最終確認
    console.log('\n🔍 最終確認:')
    const { data: finalAdmins, error: finalError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)

    if (finalError) {
      console.error('❌ 最終確認エラー:', finalError.message)
    } else if (finalAdmins && finalAdmins.length > 0) {
      const admin = finalAdmins[0]
      console.log('✅ スーパー管理者レコード確認:')
      console.log('   メール:', admin.email)
      console.log('   名前:', admin.name)
      console.log('   アクティブ:', admin.is_active ? 'はい' : 'いいえ')
      console.log('   作成日:', admin.created_at)
    } else {
      console.log('❌ レコードが見つかりません')
    }

    console.log('\n🎉 修正完了！')
    console.log('\n📋 次に実行する手順:')
    console.log('1. http://localhost:3001/login にアクセス')
    console.log('2. メール: superadmin@example.com')
    console.log('3. パスワード: admin')
    console.log('4. http://localhost:3001/super-admin にアクセス')

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// スクリプト実行
if (require.main === module) {
  fixSuperAdminTable()
}

module.exports = { fixSuperAdminTable }













