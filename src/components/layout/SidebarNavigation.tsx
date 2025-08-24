'use client'

import {
  FileText,
  Home,
  Building2,
  Calculator,
  ClipboardList,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  Shield
} from 'lucide-react'

interface NavigationItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SidebarNavigationProps {
  title?: string
  navigationItems?: NavigationItem[]
  currentPath?: string
}

const defaultNavigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: Home },
  { href: '/projects', label: 'プロジェクト管理', icon: Building2 },
  { href: '/cost-entry', label: '原価入力', icon: Calculator },
  { href: '/salary', label: '給与入力', icon: DollarSign },
  { href: '/daily-report', label: '作業日報', icon: ClipboardList },
  { href: '/analytics', label: '分析・レポート', icon: BarChart3 },
  { href: '/cash-flow', label: '資金管理', icon: DollarSign },
  { href: '/progress', label: '工事進行基準', icon: TrendingUp },
  { href: '/clients', label: 'クライアント管理', icon: Building2 },
  { href: '/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin', label: '管理者パネル', icon: Settings },
  { href: '/super-admin', label: 'スーパー管理者パネル', icon: Shield },
]

export default function SidebarNavigation({
  title = 'ナビゲーション',
  navigationItems = defaultNavigationItems,
  currentPath
}: SidebarNavigationProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 min-h-screen">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
