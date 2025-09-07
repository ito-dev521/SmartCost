'use client'

import { useState, useEffect } from 'react'
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
  Shield,
  Monitor
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  { href: '/caddon', label: 'CADDON管理', icon: Monitor },
  { href: '/admin', label: '管理者パネル', icon: Settings },
  // スーパー管理者ページはサイドバーに含めない（独立ページ）
]

export default function SidebarNavigation({
  title = '原価管理システム',
  navigationItems = defaultNavigationItems,
  currentPath
}: SidebarNavigationProps) {
  const [caddonEnabled, setCaddonEnabled] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCaddonStatus = async () => {
      try {
        console.log('🔍 SidebarNavigation: CADDON状態取得開始')
        const response = await fetch('/api/company-settings', {
          credentials: 'include', // クッキーを含める
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log('📡 SidebarNavigation: APIレスポンス:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📋 SidebarNavigation: 取得したデータ:', data)
          setCaddonEnabled(data.caddon_enabled)
          console.log('✅ SidebarNavigation: CADDON状態設定:', data.caddon_enabled)
        } else {
          const errorText = await response.text()
          console.error('❌ SidebarNavigation: APIエラー:', response.status, errorText)
          // エラーの場合はデフォルトで有効にする
          setCaddonEnabled(true)
        }
      } catch (error) {
        console.error('❌ SidebarNavigation: CADDON状態取得エラー:', error)
        // エラーの場合はデフォルトで有効にする
        setCaddonEnabled(true)
      } finally {
        setLoading(false)
        console.log('🏁 SidebarNavigation: ローディング完了')
      }
    }

    fetchCaddonStatus()
  }, [])

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    try {
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || (e as any).button === 1
      if (isModified) return
      const m = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )scope_company_id=([^;]+)/) : null
      const cid = m ? decodeURIComponent(m[1]) : ''
      if (!cid) return
      e.preventDefault()
      const url = new URL(href, window.location.origin)
      if (!url.searchParams.get('companyId')) url.searchParams.set('companyId', cid)
      router.push(url.pathname + (url.search ? url.search : ''))
    } catch {}
  }
    return (
    <div className="flex-1">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.href
          
          // CADDONリンクは会社設定が無効なら非表示
          if (item.href === '/caddon') {
            console.log('🔍 SidebarNavigation: CADDONメニュー表示判定:', { loading, caddonEnabled })
            if (loading) {
              console.log('⏳ SidebarNavigation: ローディング中のため非表示')
              // ローディング中は表示しない
              return null
            }
            if (!caddonEnabled) {
              console.log('❌ SidebarNavigation: CADDON無効のため非表示')
              return null
            }
            console.log('✅ SidebarNavigation: CADDON有効のため表示')
          }
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => onNavClick(e, item.href)}
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
  )
}
