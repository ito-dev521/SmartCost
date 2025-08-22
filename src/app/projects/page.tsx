import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectList from '@/components/projects/ProjectList'

export default async function Projects() {
  console.log('🔍 Projectsページ: 認証チェック開始')

  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.log('❌ Projectsページ: セッションなし、/loginにリダイレクト')
    redirect('/login')
  }

  // セキュリティ警告を避けるため、getUser()を使用
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.log('❌ Projectsページ: ユーザー認証失敗、/loginにリダイレクト')
    redirect('/login')
  }

  console.log('📋 Projectsページ: ユーザー認証状態', {
    userEmail: user.email,
    userId: user.id,
    emailConfirmed: user.email_confirmed_at ? 'はい' : 'いいえ'
  })

  console.log('✅ Projectsページ: 認証成功、ページ表示')
  return (
    <DashboardLayout>
      <ProjectList />
    </DashboardLayout>
  )
}
