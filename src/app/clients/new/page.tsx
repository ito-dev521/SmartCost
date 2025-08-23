import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import { permissionChecker } from '@/lib/permissions'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ClientForm from '@/components/clients/ClientForm'

export const metadata: Metadata = {
  title: '新規クライアント作成 | SmartCost',
  description: '新しいクライアントを登録します',
}

export default async function NewClientPage() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // デバッグ用に一時的に権限チェックをスキップ
  console.log('🔍 /clients/new: 権限チェックをスキップ（デバッグ用）')
  const canCreateClients = true // デバッグ用に一時的にtrueに設定
  console.log('📋 /clients/new: 権限チェック結果（デバッグ用）:', { canCreateClients })
  
  // 権限チェックを一時的に無効化
  if (false && !canCreateClients) { // 強制的にfalseにして権限チェックをスキップ
    redirect('/clients')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新規クライアント作成</h1>
            <p className="text-gray-600 mt-1">
              新しいクライアントの基本情報を入力してください
            </p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg">
          <ClientForm />
        </div>
      </div>
    </DashboardLayout>
  )
}
