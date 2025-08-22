import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import { permissionChecker } from '@/lib/permissions'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NewProjectForm from '@/components/projects/NewProjectForm'

export const metadata: Metadata = {
  title: '新規プロジェクト作成 | SmartCost',
  description: '新しい建設プロジェクトを作成します',
}

export default async function NewProjectPage() {
  const supabase = createServerComponentClient()

  // 認証チェック
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // マネージャー権限チェック
  const isManager = await permissionChecker.isManager(user.id)
  if (!isManager) {
    redirect('/projects')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h1>
            <p className="text-gray-600 mt-1">
              新しい建設プロジェクトの基本情報を入力してください
            </p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg">
          <NewProjectForm />
        </div>
      </div>
    </DashboardLayout>
  )
}
