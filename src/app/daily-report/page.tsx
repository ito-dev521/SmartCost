import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DailyReportPage from '@/components/daily-report/DailyReportPage'

export default async function DailyReport() {
  try {
    
    const supabase = createServerComponentClient()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('セッション取得エラー:', error)
      throw new Error(`セッション取得エラー: ${error.message}`)
    }

    if (!session) {
      redirect('/login')
    }

    
    return (
      <DashboardLayout>
        <DailyReportPage />
      </DashboardLayout>
    )
  } catch (error) {
    console.error('作業日報ページエラー:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : '不明なエラー'}
          </p>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }
}
