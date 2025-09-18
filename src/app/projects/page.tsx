import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectList from '@/components/projects/ProjectList'
import PermissionGuard from '@/components/auth/PermissionGuard'

export default async function Projects() {

  // 開発用: Supabase 未設定（placeholder）の場合は認証チェックをスキップ
  const isPlaceholderSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
  if (!isPlaceholderSupabase) {
    const supabase = createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      redirect('/login')
    }

    // セキュリティ警告を避けるため、getUser()を使用
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/login')
    }

  } else {
  }

  return (
    <DashboardLayout>
      <PermissionGuard requiredRole="viewer">
        <ProjectList />
      </PermissionGuard>
    </DashboardLayout>
  )
}
