'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { permissionChecker, Role, PermissionLevel } from '@/lib/permissions'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredRole?: Role
  requiredPermission?: PermissionLevel
  projectId?: string
  fallback?: React.ReactNode
  redirectTo?: string
}

export default function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  projectId,
  fallback,
  redirectTo = '/dashboard'
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkPermission()
  }, [requiredRole, requiredPermission, projectId])

  const checkPermission = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      let hasAccess = false

      if (requiredRole) {
        // ロールベースの権限チェック
        const userRole = await permissionChecker.getUserRole(user.id)
        hasAccess = userRole === requiredRole
      } else if (requiredPermission && projectId) {
        // プロジェクト権限チェック
        const permission = await permissionChecker.getUserProjectPermission(user.id, projectId)
        hasAccess = permission === requiredPermission
      } else if (requiredPermission === 'read') {
        // 一般的な閲覧権限
        hasAccess = await permissionChecker.canView(user.id)
      } else if (requiredPermission === 'write') {
        // 一般的な編集権限
        hasAccess = await permissionChecker.isUser(user.id)
      } else if (requiredPermission === 'admin') {
        // 管理者権限
        hasAccess = await permissionChecker.isAdmin(user.id)
      } else {
        // デフォルトはログインユーザーのみ
        hasAccess = true
      }

      setHasPermission(hasAccess)

      if (!hasAccess && redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Permission check error:', error)
      setHasPermission(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">権限を確認中...</span>
      </div>
    )
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-100 rounded-full p-3 mb-4">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          アクセス権限がありません
        </h3>
        <p className="text-gray-600 mb-4">
          この機能にアクセスするには、適切な権限が必要です。
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ダッシュボードに戻る
        </button>
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


