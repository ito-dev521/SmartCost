'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import ProgressManagement from '@/components/progress/ProgressManagement'
import { TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react'

interface Project {
  id: string
  name: string
  business_number: string
  status: string
  client_name?: string
}

interface ProgressData {
  id: string
  project_id: string
  progress_rate: number
  progress_date: string
  notes?: string
}

export default function Progress() {
  const [projects, setProjects] = useState<Project[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  // データ取得関数
  const fetchData = async () => {
    console.log('=== データ再取得開始 ===')
    try {
      const cidMatch = document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/)
      const cid = cidMatch ? decodeURIComponent(cidMatch[1]) : ''

      // プロジェクトデータの取得（会社スコープ）
      let { data: projRows } = await supabase
        .from('projects')
        .select('id, company_id, client_id, name, business_number, status, client_name')
        .neq('business_number', 'IP')
        .not('name', 'ilike', '%一般管理費%')
        .not('business_number', 'ilike', 'C%')
        .not('name', 'ilike', '%CADDON%')
        .order('business_number', { ascending: true })

      if (cid) {
        const clientIds = Array.from(new Set((projRows || []).map(r => r.client_id).filter(Boolean))) as string[]
        let clientCompanyMap: Record<string, string> = {}
        if (clientIds.length > 0) {
          const { data: clientRows } = await supabase
            .from('clients')
            .select('id, company_id')
            .in('id', clientIds)
          clientCompanyMap = Object.fromEntries((clientRows || []).map(cr => [cr.id, cr.company_id]))
        }
        projRows = (projRows || []).filter(p => p.company_id === cid || (p.client_id && clientCompanyMap[p.client_id as string] === cid)) as any
      }

      // 進捗データの取得（APIで会社スコープ適用）
      const progressEndpoint = `/api/progress${cid ? `?companyId=${encodeURIComponent(cid)}` : ''}`
      const progressRes = await fetch(progressEndpoint)
      const progressJson = await progressRes.json()
      const progress = progressJson.data

      console.log('再取得したデータ:', {
        projectsCount: (projRows as any)?.length,
        progressCount: progress?.length
      })

      setProjects((projRows as any) || [])
      setProgressData(progress || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初回データ取得
  useEffect(() => {
    fetchData()
  }, [])

  // 進捗更新時のコールバック
  const handleProgressUpdate = () => {
    console.log('=== 進捗更新コールバック実行 ===')
    fetchData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

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



        <ProgressManagement
          initialProjects={projects || []}
          initialProgressData={progressData || []}
          onProgressUpdate={handleProgressUpdate}
        />

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
              const latestProgress = projectProgress.sort((a, b) => {
                const bTime = new Date((b as any).created_at || b.progress_date).getTime()
                const aTime = new Date((a as any).created_at || a.progress_date).getTime()
                return bTime - aTime
              })[0]

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


      </div>
        </PermissionGuard>
    </DashboardLayout>
  )
}




