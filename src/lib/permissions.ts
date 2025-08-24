import { createServerComponentClient } from '@/lib/supabase-server'

// Supabaseクライアントの型定義
type SupabaseClient = ReturnType<typeof createServerComponentClient>

// 権限レベルの定義
export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin'
} as const

export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS]

// ロール定義
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// 権限チェックユーティリティ
export class PermissionChecker {
  private supabase = createServerComponentClient()

  // ユーザーのロールを取得
  async getUserRole(userId: string): Promise<Role | null> {
    try {
      console.log('🔍 PermissionChecker: getUserRole開始', { userId })
      const { data: user, error } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      console.log('📋 PermissionChecker: getUserRole 結果', { userId, user, error })
      return user?.role as Role || null
    } catch (error) {
      console.error('❌ PermissionChecker: getUserRole エラー:', error)
      return null
    }
  }

  // APIルート用の権限チェック（Supabaseクライアントを引数で受け取る）
  async getUserRoleWithClient(supabase: SupabaseClient, userId: string): Promise<Role | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      return user?.role as Role || null
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  // APIルート用の管理者権限チェック
  async isAdminWithClient(supabase: SupabaseClient, userId: string): Promise<boolean> {
    try {
      console.log('🔍 PermissionChecker: isAdminWithClientチェック開始', { userId })
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      const role = user?.role as Role
      console.log('📋 PermissionChecker: ユーザーロール取得', { userId, role })
      return role === ROLES.ADMIN
    } catch (error) {
      console.error('❌ PermissionChecker: isAdminWithClientエラー:', error)
      return false
    }
  }

  // ユーザーのプロジェクト権限を取得
  async getUserProjectPermission(userId: string, projectId: string): Promise<PermissionLevel | null> {
    try {
      const { data: permission } = await this.supabase
        .from('user_permissions')
        .select('permission_level')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single()

      return permission?.permission_level as PermissionLevel || null
    } catch (error) {
      console.error('Error fetching user project permission:', error)
      return null
    }
  }

  // 管理者権限チェック
  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === ROLES.ADMIN
  }

  // マネージャー権限チェック
  async isManager(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === ROLES.MANAGER || role === ROLES.ADMIN
  }

  // ユーザー権限チェック（一般ユーザー以上）
  async isUser(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === ROLES.USER || role === ROLES.MANAGER || role === ROLES.ADMIN
  }

  // ビューアー権限チェック（閲覧権限以上）
  async canView(userId: string): Promise<boolean> {
    console.log('🔍 PermissionChecker: canViewチェック開始', { userId })
    const role = await this.getUserRole(userId)
    console.log('📋 PermissionChecker: canView ユーザーロール取得', { userId, role })
    const result = role === ROLES.VIEWER || role === ROLES.USER || role === ROLES.MANAGER || role === ROLES.ADMIN
    console.log('📋 PermissionChecker: canView 結果', { userId, role, result })
    return result
  }

  // プロジェクト閲覧権限チェック
  async canViewProject(userId: string, projectId: string): Promise<boolean> {
    // 管理者は全てのプロジェクトを閲覧可能
    if (await this.isAdmin(userId)) {
      return true
    }

    // 一般ユーザーは割り当てられたプロジェクトのみ閲覧可能
    const permission = await this.getUserProjectPermission(userId, projectId)
    return permission !== null
  }

  // プロジェクト編集権限チェック
  async canEditProject(userId: string, projectId: string): Promise<boolean> {
    // 管理者は全てのプロジェクトを編集可能
    if (await this.isAdmin(userId)) {
      return true
    }

    // 一般ユーザーはwrite権限以上のプロジェクトのみ編集可能
    const permission = await this.getUserProjectPermission(userId, projectId)
    return permission === PERMISSION_LEVELS.WRITE || permission === PERMISSION_LEVELS.ADMIN
  }

  // プロジェクト管理者権限チェック
  async canAdminProject(userId: string, projectId: string): Promise<boolean> {
    // 管理者は全てのプロジェクトを管理可能
    if (await this.isAdmin(userId)) {
      return true
    }

    // 一般ユーザーはadmin権限のプロジェクトのみ管理可能
    const permission = await this.getUserProjectPermission(userId, projectId)
    return permission === PERMISSION_LEVELS.ADMIN
  }

  // ユーザー管理権限チェック
  async canManageUsers(userId: string): Promise<boolean> {
    return await this.isAdmin(userId)
  }

  // システム設定権限チェック
  async canManageSystem(userId: string): Promise<boolean> {
    return await this.isAdmin(userId)
  }

  // 分析・レポート閲覧権限チェック
  async canViewAnalytics(userId: string): Promise<boolean> {
    return await this.isManager(userId)
  }

  // プロジェクト管理権限チェック
  async canManageProjects(userId: string): Promise<boolean> {
    return await this.isManager(userId)
  }

  // 作業日報閲覧権限チェック
  async canViewDailyReports(userId: string): Promise<boolean> {
    return await this.isUser(userId)
  }

  // 工事進行基準閲覧権限チェック
  async canViewProgress(userId: string): Promise<boolean> {
    return await this.isUser(userId)
  }

  // 原価入力権限チェック
  async canManageCosts(userId: string): Promise<boolean> {
    return await this.isUser(userId)
  }

  // 原価入力閲覧権限チェック
  async canViewCostEntries(userId: string): Promise<boolean> {
    return await this.isUser(userId)
  }

  // 給与入力権限チェック
  async canManageSalaries(userId: string): Promise<boolean> {
    return await this.isManager(userId)
  }

  // 資金管理権限チェック
  async canManageCashFlow(userId: string): Promise<boolean> {
    return await this.isUser(userId)
  }

  // ユーザー作成権限チェック
  async canCreateUsers(userId: string): Promise<boolean> {
    return await this.isAdmin(userId)
  }

  // ユーザー編集権限チェック
  async canEditUser(userId: string, targetUserId: string): Promise<boolean> {
    // 自分自身は編集可能
    if (userId === targetUserId) {
      return true
    }

    // 管理者は全てのユーザーを編集可能
    return await this.isAdmin(userId)
  }

  // ユーザー削除権限チェック
  async canDeleteUser(userId: string, targetUserId: string): Promise<boolean> {
    // 自分自身は削除不可
    if (userId === targetUserId) {
      return false
    }

    // 管理者のみユーザーを削除可能
    return await this.isAdmin(userId)
  }

  // クライアント閲覧権限チェック
  async canViewClients(userId: string): Promise<boolean> {
    console.log('🔍 PermissionChecker: canViewClientsチェック開始', { userId })
    const result = await this.canView(userId)
    console.log('📋 PermissionChecker: canViewClients結果', { userId, result })
    return result
  }

  // クライアント作成権限チェック
  async canCreateClients(userId: string): Promise<boolean> {
    return await this.isManager(userId)
  }

  // クライアント編集権限チェック
  async canEditClients(userId: string): Promise<boolean> {
    return await this.isManager(userId)
  }

  // クライアント削除権限チェック
  async canDeleteClients(userId: string): Promise<boolean> {
    return await this.isAdmin(userId)
  }
}

// 権限チェックのインスタンス
export const permissionChecker = new PermissionChecker()

// Reactコンポーネント用のフック
export async function usePermissions(userId: string) {
  return {
    isAdmin: await permissionChecker.isAdmin(userId),
    isManager: await permissionChecker.isManager(userId),
    isUser: await permissionChecker.isUser(userId),
    canView: await permissionChecker.canView(userId),
    canManageUsers: await permissionChecker.canManageUsers(userId),
    canManageSystem: await permissionChecker.canManageSystem(userId),
    canViewAnalytics: await permissionChecker.canViewAnalytics(userId),
    canCreateUsers: await permissionChecker.canCreateUsers(userId)
  }
}

// プロジェクト権限チェック用のフック
export async function useProjectPermissions(userId: string, projectId: string) {
  return {
    canView: await permissionChecker.canViewProject(userId, projectId),
    canEdit: await permissionChecker.canEditProject(userId, projectId),
    canAdmin: await permissionChecker.canAdminProject(userId, projectId)
  }
}
