'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { AdminGuard } from '@/components/auth/PermissionGuard'
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  business_number: string
  client_name: string
  contract_amount: number
  start_date: string
  end_date: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  created_at: string
}

const statusConfig = {
  planning: { label: '計画中', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '完了', color: 'bg-green-100 text-green-800' },
  on_hold: { label: '保留中', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '中止', color: 'bg-red-100 text-red-800' }
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchProjects()
  }, [searchParams])

  const fetchProjects = async () => {
    try {

      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // APIエンドポイントからプロジェクトを取得
      const companyId = searchParams?.get('companyId') || ''
      const endpoint = `/api/projects${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''}`
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      })


      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        const errorText = await response.text()
        console.error('❌ ProjectList: プロジェクト取得エラー:', errorText)
        setProjects([]) // エラー時は空の配列に設定
      }
    } catch (error) {
      console.error('❌ ProjectList: プロジェクト取得エラー:', error)
      setProjects([]) // エラー時は空の配列に設定
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const handleEdit = (project: Project) => {
    // 編集ページにリダイレクト
    window.location.href = `/projects/${project.id}/edit`
  }

  const handleDelete = async (projectId: string) => {
    
    if (!confirm('このプロジェクトを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers,
      })

      if (response.ok) {
        // プロジェクト一覧を再取得
        fetchProjects()
      } else {
        const errorText = await response.text()
        console.error('❌ ProjectList: プロジェクト削除エラー:', errorText)
        alert('プロジェクトの削除に失敗しました')
      }
    } catch (error) {
      console.error('❌ ProjectList: プロジェクト削除エラー:', error)
      alert('プロジェクトの削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト管理</h1>
          <p className="text-gray-600 mt-1">建設プロジェクトの一覧と管理</p>
        </div>
        {/* 一時的にAdminGuardを無効化 */}
        <Link
          href="/projects/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規プロジェクト
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                  type="text"
                  placeholder="プロジェクト名、発注者、場所で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
        </div>
                      <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべてのステータス</option>
                <option value="planning">計画中</option>
                <option value="active">進行中</option>
                <option value="completed">完了</option>
                <option value="suspended">保留中</option>
                <option value="cancelled">中止</option>
              </select>
      </div>

      {/* プロジェクト一覧 */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">プロジェクトがありません</h3>
            <p className="text-gray-600 mb-4">まだプロジェクトが作成されていません</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              最初のプロジェクトを作成
            </Link>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              onClick={() => handleEdit(project)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleEdit(project)
                }
              }}
              aria-label={`プロジェクト「${project.name}」を編集する`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.business_number ? `[${project.business_number}] ` : ''}{project.name}
                        <span className="text-sm font-normal text-gray-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          (クリックして編集)
                        </span>
                      </h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status && statusConfig[project.status] 
                        ? statusConfig[project.status].color 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status && statusConfig[project.status] 
                        ? statusConfig[project.status].label 
                        : (project.status || '未設定')
                      }
                    </span>
                  </div>
                  <div className="mb-4 text-sm text-gray-600">
                    <span>発注者: {project.client_name}</span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-base font-medium text-gray-700">
                      <span className="text-gray-600 mr-2">契約金額:</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(project.contract_amount)}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center text-base text-gray-700">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="text-gray-600 mr-2">開始日:</span>
                        <span className="font-medium">{formatDate(project.start_date)}</span>
                      </div>
                      <div className="flex items-center text-base text-gray-700">
                        <Calendar className="h-5 w-5 mr-2 text-red-600" />
                        <span className="text-gray-600 mr-2">終了日:</span>
                        <span className="font-medium">{formatDate(project.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>作成日: {formatDate(project.created_at)}</span>
                  </div>
                </div>

                <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">総プロジェクト数</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">総契約金額</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(projects.reduce((sum, p) => sum + p.contract_amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">進行中</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">計画中</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'planning').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
