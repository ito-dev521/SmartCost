'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { permissionChecker } from '@/lib/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'manager' | 'admin'
  requiredPermission?: string
  fallback?: React.ReactNode
  projectId?: string
}

export default function PermissionGuard({ 
  children, 
  requiredRole = 'user',
  requiredPermission,
  fallback,
  projectId
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        let permission = false

        if (requiredPermission) {
          // プロジェクト単位の権限チェック（read/write/admin）
          if (projectId && ['read', 'write', 'admin'].includes(requiredPermission)) {
            if (requiredPermission === 'read') {
              permission = await permissionChecker.canViewProject(user.id, projectId)
            } else if (requiredPermission === 'write') {
              permission = await permissionChecker.canEditProject(user.id, projectId)
            } else if (requiredPermission === 'admin') {
              permission = await permissionChecker.canAdminProject(user.id, projectId)
            }
          } else {
            // グローバル権限チェック
            switch (requiredPermission) {
            case 'canManageProjects':
              permission = await permissionChecker.canManageProjects(user.id)
              break
            case 'canViewAnalytics':
              permission = await permissionChecker.canViewAnalytics(user.id)
              break
            case 'canViewDailyReports':
              permission = await permissionChecker.canViewDailyReports(user.id)
              break
            case 'canViewCostEntries':
              permission = await permissionChecker.canViewCostEntries(user.id)
              break
            case 'canManageSalaries':
              permission = await permissionChecker.canManageSalaries(user.id)
              break
            case 'canViewProgress':
              permission = await permissionChecker.canViewProgress(user.id)
              break
            case 'canManageCosts':
              permission = await permissionChecker.canManageCosts(user.id)
              break
            case 'canManageCashFlow':
              permission = await permissionChecker.canManageCashFlow(user.id)
              break
            case 'canViewClients':
              permission = await permissionChecker.canViewClients(user.id)
              break
            case 'canManageUsers':
              permission = await permissionChecker.canManageUsers(user.id)
              break
            case 'canManageSystem':
              permission = await permissionChecker.canManageSystem(user.id)
              break
            case 'canManageCaddon':
              permission = await permissionChecker.canManageCaddon(user.id)
              break
            default:
              permission = false
            }
          }
        } else {
          // ロールベースの権限チェック
          switch (requiredRole) {
            case 'admin':
              permission = await permissionChecker.isAdmin(user.id)
              break
            case 'manager':
              permission = await permissionChecker.isManager(user.id)
              break
            case 'user':
              permission = await permissionChecker.isUser(user.id)
              break
            default:
              permission = false
          }
        }

        setHasPermission(permission)
      } catch (error) {
        console.error('権限チェックエラー:', error)
        setHasPermission(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [requiredRole, requiredPermission, projectId, router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">権限を確認中...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">アクセス権限がありません</h3>
          <p className="mt-2 text-sm text-gray-500">
            このページにアクセスするには{requiredRole === 'admin' ? '管理者' : requiredRole === 'manager' ? 'マネージャー' : '一般ユーザー'}以上の権限が必要です。
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 特定のロールが必要なコンポーネント
export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function ManagerGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="manager" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function UserGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="user" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

// プロジェクト権限が必要なコンポーネント
export function ProjectReadGuard({
  children,
  projectId,
  fallback
}: {
  children: React.ReactNode
  projectId: string
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard
      requiredPermission="read"
      projectId={projectId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function ProjectWriteGuard({
  children,
  projectId,
  fallback
}: {
  children: React.ReactNode
  projectId: string
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard
      requiredPermission="write"
      projectId={projectId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function ProjectAdminGuard({
  children,
  projectId,
  fallback
}: {
  children: React.ReactNode
  projectId: string
  fallback?: React.ReactNode
}) {
  return (
    <PermissionGuard
      requiredPermission="admin"
      projectId={projectId}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}





