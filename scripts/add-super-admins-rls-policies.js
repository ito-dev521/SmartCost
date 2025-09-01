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

async function addPolicies() {
  const statements = [
    // 認証ユーザー自身のsuper_admins行を参照可能にする
    `CREATE POLICY IF NOT EXISTS "super_admins self select" ON super_admins
     FOR SELECT USING (email = auth.jwt() ->> 'email')`,
    // 管理者は追加で更新も可能（必要なら）
    `CREATE POLICY IF NOT EXISTS "super_admins self update" ON super_admins
     FOR UPDATE USING (email = auth.jwt() ->> 'email') WITH CHECK (email = auth.jwt() ->> 'email')`
  ]

  try {
    for (const sql of statements) {
      console.log('\n🛡️ 実行:', sql)
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error && !String(error.message).includes('already exists')) {
        console.error('❌ エラー:', error.message)
      } else {
        console.log('✅ 完了')
      }
    }
  } catch (e) {
    console.error('❌ addPolicies エラー:', e.message)
    process.exit(1)
  }
}

if (require.main === module) {
  addPolicies()
}

module.exports = { addPolicies }


