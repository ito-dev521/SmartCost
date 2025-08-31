'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import {
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import ChatBot from '@/components/ai/ChatBot'
import SidebarNavigation from './SidebarNavigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  hideSidebar?: boolean
}

export default function DashboardLayout({ children, hideSidebar = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {!hideSidebar && (
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
            <SidebarNavigation currentPath={pathname} />
            <div className="mt-auto px-4 pb-4">
              <button
                onClick={handleSignOut}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <LogOut className="h-6 w-6" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!hideSidebar && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-xl font-bold text-gray-900">原価管理システム</h1>
            </div>
            <SidebarNavigation currentPath={pathname} />
            <div className="mt-auto">
              <button
                onClick={handleSignOut}
                className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <LogOut className="h-6 w-6" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={hideSidebar ? '' : 'lg:pl-64'}>
        {/* Mobile header */}
        {!hideSidebar && (
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
        )}

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* AI ChatBot */}
      <ChatBot />
    </div>
  )
}
