import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CompanyManagement from '@/components/super-admin/CompanyManagement'

export const metadata: Metadata = {
  title: 'スーパー管理者パネル | SmartCost',
  description: '全法人の管理とシステム設定',
}

export default async function SuperAdminPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // スーパー管理者チェック
  console.log('🔍 super-adminページ: スーパー管理者チェック開始')
  console.log('   ユーザー:', session.user.email)

  let { data: superAdmin, error: checkError } = await supabase
    .from('super_admins')
    .select('*')
    .eq('email', session.user.email)
    .eq('is_active', true)
    .single()

  console.log('   スーパー管理者レコード:', superAdmin)
  console.log('   チェックエラー:', checkError)

  // スーパー管理者レコードがない場合は作成
  if (!superAdmin) {
    console.log('📝 スーパー管理者レコードがないため作成開始')
    const { data: newSuperAdmin, error: insertError } = await supabase
      .from('super_admins')
      .insert([{
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email,
        password_hash: '$2b$10$demo.hash.for.super.admin.only',
        is_active: true
      }])
      .select()
      .single()

    console.log('   作成結果:', newSuperAdmin)
    console.log('   作成エラー:', insertError)

    if (insertError) {
      // 重複エラー以外はログ出力
      if (!insertError.message.includes('duplicate key')) {
        console.error('スーパー管理者作成エラー:', insertError)
      }
    } else {
      superAdmin = newSuperAdmin
      console.log('✅ スーパー管理者レコード作成成功')
    }
  } else {
    console.log('✅ 既存のスーパー管理者レコード使用')
  }

  // 最終チェック：スーパー管理者権限がない場合はダッシュボードに
  if (!superAdmin) {
    console.log('スーパー管理者権限なし、ダッシュボードにリダイレクト')
    console.log('現在のユーザー:', session.user.email)
    console.log('スーパー管理者チェックエラー:', checkError)
    redirect('/dashboard')
  }

  return (
    <DashboardLayout>
      <CompanyManagement />
    </DashboardLayout>
  )
}
