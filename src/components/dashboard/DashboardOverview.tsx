'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import {
  Building2,
  Calculator,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalProjects: number
  totalCost: number
  completedProjects: number
  activeProjects: number
  totalContractAmount: number
  monthlyReports: number
  totalUsers: number
  adminUsers: number
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // 会社スコープ
      const cidMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/) : null
      const cid = cidMatch ? decodeURIComponent(cidMatch[1]) : ''

      // 1. プロジェクト統計を取得（会社スコープでフィルタリング）
      let projectsQuery = supabase
        .from('projects')
        .select('id, status, contract_amount, business_number, name, company_id, client_id')
        .neq('business_number', 'IP')  // 一般管理費プロジェクトは除外（CADDONは除外しない）
        .not('name', 'ilike', '%一般管理費%')

      // 会社IDが指定されている場合は、その会社のプロジェクトのみ取得
      if (cid) {
        projectsQuery = projectsQuery.eq('company_id', cid)
      }

      const { data: projects, error: projectsError } = await projectsQuery

      if (projectsError) {
        console.error('プロジェクト取得エラー:', projectsError)
        throw projectsError
      }

      const filteredProjects = projects || []

      // 2. 原価データを取得（会社スコープでフィルタリング）
      let costQuery = supabase
        .from('cost_entries')
        .select('amount, entry_type')
      
      if (cid) {
        costQuery = costQuery.eq('company_id', cid)
      }

      const { data: costEntries, error: costError } = await costQuery

      if (costError) {
        console.error('原価データ取得エラー:', costError)
        throw costError
      }

      // 3. 作業日報データを取得（今月分、会社スコープでフィルタリング）
      const currentDate = new Date()
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      let reportsQuery = supabase
        .from('daily_reports')
        .select('id, date')
        .gte('date', startOfMonth.toISOString().slice(0, 10))
        .lte('date', endOfMonth.toISOString().slice(0, 10))
      
      if (cid) {
        reportsQuery = reportsQuery.eq('company_id', cid)
      }

      const { data: dailyReports, error: reportsError } = await reportsQuery

      if (reportsError) {
        console.error('作業日報取得エラー:', reportsError)
        throw reportsError
      }

      // 4. ユーザーデータを取得（会社スコープでフィルタリング）
      let usersQuery = supabase
        .from('users')
        .select('id, role')
      
      if (cid) {
        usersQuery = usersQuery.eq('company_id', cid)
      }

      const { data: users, error: usersError } = await usersQuery

      if (usersError) {
        console.error('ユーザーデータ取得エラー:', usersError)
        throw usersError
      }

      // 統計情報を計算
      const totalProjects = filteredProjects?.length || 0
      const completedProjects = filteredProjects?.filter(p => p.status === 'completed').length || 0
      const activeProjects = filteredProjects?.filter(p => p.status === 'in_progress').length || 0
      // CADDONシステムの月次請求（caddon_billing.total_amount）も契約金額相当として加算
      let totalContractAmount = filteredProjects?.reduce((sum, p) => sum + (p.contract_amount || 0), 0) || 0

      try {
        // CADDONの請求データを会社スコープで取得
        let caddonQuery = supabase
          .from('caddon_billing')
          .select('total_amount')
        
        if (cid) {
          // 会社IDが指定されている場合は、その会社のCADDONデータのみ取得
          caddonQuery = caddonQuery.eq('company_id', cid)
        }
        
        const { data: caddonBillings, error: caddonError } = await caddonQuery

        if (caddonError) {
          console.error('CADDON請求取得エラー:', caddonError)
        } else {
          const caddonTotal = (caddonBillings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0)
          totalContractAmount += caddonTotal
        }
      } catch (e) {
        console.error('CADDON合算処理エラー:', e)
      }
      
      // 原価合計を計算
      const totalCost = costEntries?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
      
      // 今月の作業日報数
      const monthlyReports = dailyReports?.length || 0
      
      // ユーザー統計
      let totalUsers = users?.length || 0
      let adminUsers = users?.filter(u => u.role === 'admin').length || 0
      if (cid) {
        const { data: usersByCompany } = await supabase
          .from('users')
          .select('id, role, company_id')
          .eq('company_id', cid)
        totalUsers = usersByCompany?.length || 0
        adminUsers = (usersByCompany || []).filter(u => u.role === 'admin').length || 0
      }

      setStats({
        totalProjects,
        totalCost,
        completedProjects,
        activeProjects,
        totalContractAmount,
        monthlyReports,
        totalUsers,
        adminUsers
      })

    } catch (error) {
      console.error('ダッシュボード統計取得エラー:', error)
      // エラー時はデフォルト値を設定
      setStats({
        totalProjects: 0,
        totalCost: 0,
        completedProjects: 0,
        activeProjects: 0,
        totalContractAmount: 0,
        monthlyReports: 0,
        totalUsers: 0,
        adminUsers: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'プロジェクト作成',
      description: '新しいプロジェクトを開始',
      href: '/projects',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: '原価入力',
      description: '工事費を入力',
      href: '/cost-entry',
      icon: Calculator,
      color: 'bg-green-500'
    },
    {
      title: '資金管理',
      description: '資金状況を確認',
      href: '/cash-flow',
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      title: 'レポート',
      description: '分析・レポート作成',
      href: '/analytics',
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ]

  const statCards = [
    {
      title: '総プロジェクト数',
      value: stats?.totalProjects || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '一般管理費を除く'
    },
    {
      title: '総契約金額',
      value: `${(stats?.totalContractAmount || 0).toLocaleString()}円`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'プロジェクト合計'
    },
    {
      title: '今月の作業日報',
      value: stats?.monthlyReports || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '件数'
    },
    {
      title: '登録ユーザー数',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: `管理者: ${stats?.adminUsers || 0}名`
    }
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-1">建設原価管理システムの概要</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ja-JP')}
        </div>
      </div>

      {/* 統計カード */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 追加統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* プロジェクト詳細 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            プロジェクト詳細
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">総プロジェクト数</span>
              <span className="font-medium">{stats?.totalProjects || 0}件</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">完了プロジェクト</span>
              <span className="font-medium text-green-600">{stats?.completedProjects || 0}件</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">進行中プロジェクト</span>
              <span className="font-medium text-blue-600">{stats?.activeProjects || 0}件</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">総契約金額</span>
              <span className="font-medium text-green-600">
                {stats?.totalContractAmount ? `${(stats.totalContractAmount / 1000000).toFixed(1)}百万円` : '0円'}
              </span>
            </div>
          </div>
        </div>

        {/* システム情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            システム情報
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">登録ユーザー数</span>
              <span className="font-medium">{stats?.totalUsers || 0}名</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">管理者ユーザー</span>
              <span className="font-medium text-purple-600">{stats?.adminUsers || 0}名</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">今月の作業日報</span>
              <span className="font-medium text-blue-600">{stats?.monthlyReports || 0}件</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">総原価</span>
              <span className="font-medium text-green-600">
                {stats?.totalCost ? `${(stats.totalCost / 1000000).toFixed(1)}百万円` : '0円'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions
            .filter(a => {
              if (a.href === '/caddon') {
                try {
                  const m = typeof document !== 'undefined' ? document.cookie.match(/company_caddon_enabled=([^;]+)/) : null
                  const on = m ? m[1] !== 'false' : true
                  return on
                } catch { return true }
              }
              return true
            })
            .map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
        <div className="space-y-4">
          {/* プロジェクト状況 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">プロジェクト状況</p>
                <p className="text-xs text-gray-600">
                  完了: {stats?.completedProjects || 0}件 / 進行中: {stats?.activeProjects || 0}件
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-600">
                {stats?.completedProjects && stats?.activeProjects 
                  ? Math.round((stats.completedProjects / (stats.completedProjects + stats.activeProjects)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">完了率</p>
            </div>
          </div>

          {/* 今月の作業状況 */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">今月の作業日報</p>
                <p className="text-xs text-gray-600">
                  {stats?.monthlyReports || 0}件の日報が作成されています
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">
                {new Date().getDate()}日
              </p>
              <p className="text-xs text-gray-500">今日の日付</p>
            </div>
          </div>

          {/* システム利用状況 */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">システム利用状況</p>
                <p className="text-xs text-gray-600">
                  総ユーザー: {stats?.totalUsers || 0}名 / 管理者: {stats?.adminUsers || 0}名
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-600">
                {stats?.totalUsers && stats?.adminUsers 
                  ? Math.round((stats.adminUsers / stats.totalUsers) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">管理者比率</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}








