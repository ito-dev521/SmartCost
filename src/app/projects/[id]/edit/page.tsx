import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectEditForm from '@/components/projects/ProjectEditForm'

export const metadata: Metadata = {
  title: 'プロジェクト編集 | SmartCost',
  description: '建設プロジェクトを編集します',
}

export default async function EditProjectPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = createServerComponentClient()

  // 認証チェック
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // デバッグ用に権限チェックを完全にスキップ
  const { id } = await params

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">プロジェクト編集</h1>
            <p className="text-gray-600 mt-1">
              建設プロジェクトの情報を編集してください
            </p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg">
          <ProjectEditForm projectId={id} />
        </div>
      </div>
    </DashboardLayout>
  )
}














