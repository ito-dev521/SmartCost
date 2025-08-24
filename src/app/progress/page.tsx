import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react'

export default async function Progress() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // プロジェクト進捗データの取得
  const { data: projects } = await supabase
    .from('projects')
    .select('*')

  // 進捗データの取得
  const { data: progressData } = await supabase
    .from('project_progress')
    .select('*')

  return (
    <DashboardLayout>
      <PermissionGuard requiredPermission="canViewProgress">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">工事進行基準</h1>
              <p className="text-sm text-gray-600">プロジェクトの進捗管理と完了基準の設定</p>
            </div>
          </div>

        {/* 進捗統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">計画中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects?.filter(p => p.status === 'planning').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">進行中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects?.filter(p => p.status === 'in_progress').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">完了</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects?.filter(p => p.status === 'completed').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">保留中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects?.filter(p => p.status === 'on_hold').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">中止</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects?.filter(p => p.status === 'cancelled').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* プロジェクト進捗一覧 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">プロジェクト進捗一覧</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {projects?.map((project) => {
              const projectProgress = progressData?.filter(p => p.project_id === project.id) || []
              const latestProgress = projectProgress.sort((a, b) =>
                new Date(b.progress_date).getTime() - new Date(a.progress_date).getTime()
              )[0]

              return (
                <div key={project.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {project.business_number} - {project.name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'planning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.status === 'on_hold'
                            ? 'bg-gray-100 text-gray-800'
                            : project.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'completed' ? '完了'
                           : project.status === 'in_progress' ? '進行中'
                           : project.status === 'planning' ? '計画中'
                           : project.status === 'on_hold' ? '保留中'
                           : project.status === 'cancelled' ? '中止'
                           : '不明'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.client_name}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>進捗率</span>
                          <span>{latestProgress?.progress_rate || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${latestProgress?.progress_rate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">最終更新</p>
                        <p className="text-sm font-medium">
                          {latestProgress
                            ? new Date(latestProgress.progress_date).toLocaleDateString('ja-JP')
                            : '未記録'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {(!projects || projects.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>プロジェクトがまだ登録されていません</p>
              </div>
            )}
          </div>
        </div>

        {/* 進捗管理機能 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">進捗入力</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プロジェクト
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>プロジェクトを選択...</option>
                  {projects?.filter(p => p.status === 'in_progress' || p.status === 'planning').map(project => (
                    <option key={project.id} value={project.id}>
                      {project.business_number} - {project.name} ({project.status === 'in_progress' ? '進行中' : '計画中'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  進捗率 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  記録日
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                進捗を記録
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">完了基準設定</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">工事進行基準について</h4>
                <p className="text-sm text-gray-600">
                  工事進行基準では、プロジェクトの進捗に応じて収益と費用を認識します。
                  進捗率に基づいて正確な収益計算を行うことができます。
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">計画段階</span>
                  <span className="text-sm text-gray-600">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">設計段階</span>
                  <span className="text-sm text-gray-600">10-20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">施工準備</span>
                  <span className="text-sm text-gray-600">20-30%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">施工中</span>
                  <span className="text-sm text-gray-600">30-90%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">竣工・引渡し</span>
                  <span className="text-sm text-gray-600">90-100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </PermissionGuard>
    </DashboardLayout>
  )
}




