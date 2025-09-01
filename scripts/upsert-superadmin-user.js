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
  auth: { autoRefreshToken: false, persistSession: false }
})

async function upsertSuperadminUser() {
  const email = 'genka_ad@ii-stylelab.com'
  const displayName = 'スーパー管理者'

  try {
    console.log('\n🔍 AuthユーザーID取得...')
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) throw listErr

    const authUser = list.users.find(u => u.email === email)
    if (!authUser) {
      console.error('❌ Authユーザーが見つかりません。先に reset-super-admin-password.js を実行してください')
      process.exit(1)
    }

    console.log('✅ 発見:', authUser.id)

    console.log('\n🔍 サンプル会社ID取得...')
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'サンプル建設コンサルタント株式会社')
      .single()

    const companyId = company?.id || null
    console.log('会社ID:', companyId || '(なし)')

    console.log('\n📝 usersテーブルにUPSERT...')
    const { data: inserted, error: upsertErr } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email,
        name: displayName,
        role: 'superadmin',
        company_id: companyId,
        is_active: true
      }, { onConflict: 'id' })
      .select()
      .single()

    if (upsertErr) throw upsertErr
    console.log('✅ users UPSERT 完了:', inserted?.id)

  } catch (e) {
    console.error('❌ upsertSuperadminUser エラー:', e.message)
    process.exit(1)
  }
}

if (require.main === module) {
  upsertSuperadminUser()
}

module.exports = { upsertSuperadminUser }


