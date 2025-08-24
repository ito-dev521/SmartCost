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
      // 仮のデータを使用（実際のデータベース実装時に変更）
      // TODO: 実際のデータベースから統計情報を取得
      setStats({
        totalProjects: 12,
        totalCost: 125000000,
        completedProjects: 8,
        activeProjects: 4
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
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
      bgColor: 'bg-blue-50'
    },
    {
      title: '総原価',
      value: `${(stats?.totalCost || 0).toLocaleString()}円`,
      icon: Calculator,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '完了プロジェクト',
      value: stats?.completedProjects || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '進行中プロジェクト',
      value: stats?.activeProjects || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
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
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* クイックアクション */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
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

      {/* 最近のアクティビティ（プレースホルダー） */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>最近のアクティビティはありません</p>
          <p className="text-sm mt-2">プロジェクトを作成して開始しましょう</p>
        </div>
      </div>
    </div>
  )
}





