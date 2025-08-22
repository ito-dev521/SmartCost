'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import {
  BarChart3,
  Building2,
  Calculator,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  Users,
  X,
  Bot,
} from 'lucide-react'
import AIAssistant from '@/components/ai/AIAssistant'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 権限に応じたナビゲーション項目
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'ダッシュボード', href: '/dashboard', icon: Home, requiresAuth: true },
      { name: 'プロジェクト管理', href: '/projects', icon: Building2, requiresAuth: true },
    ]

    // デフォルトでは全ユーザーに表示（実際の権限チェックは各ページで行う）
    const userItems = [
      { name: '原価入力', href: '/cost-entry', icon: Calculator, requiresAuth: true },
      { name: '分析・レポート', href: '/analytics', icon: BarChart3, requiresAuth: true },
      { name: '資金管理', href: '/cash-flow', icon: DollarSign, requiresAuth: true },
      { name: '工事進行基準', href: '/progress', icon: TrendingUp, requiresAuth: true },
    ]

    const managerItems: typeof baseItems = [
      // マネージャー固有のメニュー項目があればここに追加
    ]

    const adminItems = [
      { name: 'ユーザー管理', href: '/users', icon: Users, requiresAuth: true },
      { name: 'クライアント管理', href: '/clients', icon: Building2, requiresAuth: true },
      { name: '管理者パネル', href: '/admin', icon: Settings, requiresAuth: true },
    ]

    // スーパー管理者用メニュー（スーパー管理者のみ表示）
    const superAdminItems = [
      { name: 'スーパー管理者パネル', href: '/super-admin', icon: Settings, requiresAuth: true },
    ]

    return [...baseItems, ...userItems, ...managerItems, ...adminItems]
  }

  const navigation = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">原価管理システム</h1>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-4 pb-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <button
                onClick={handleSignOut}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <LogOut className="h-6 w-6 shrink-0" />
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900">原価管理システム</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleSignOut}
                  className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  ログアウト
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            建設原価管理システム
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* AIアシスタント（全ページで利用可能） */}
      <AIAssistant />
    </div>
  )
}
