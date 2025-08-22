import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { permissionChecker } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'プロジェクトIDが指定されていません' },
        { status: 400 }
      )
    }

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // プロジェクト管理者権限チェック
    const canAdminProject = await permissionChecker.canAdminProject(user.id, projectId)
    if (!canAdminProject) {
      return NextResponse.json(
        { error: 'このプロジェクトの権限を管理する権限がありません' },
        { status: 403 }
      )
    }

    // プロジェクト権限一覧取得
    const { data: permissions, error: permissionsError } = await supabase
      .from('user_permissions')
      .select(`
        id,
        user_id,
        project_id,
        permission_level,
        created_at,
        users (
          id,
          name,
          email,
          role
        )
      `)
      .eq('project_id', projectId)

    if (permissionsError) {
      console.error('Permissions fetch error:', permissionsError)
      return NextResponse.json(
        { error: '権限データの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Project permissions API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { projectId, userId: targetUserId, permissionLevel } = await request.json()

    if (!projectId || !targetUserId || !permissionLevel) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // プロジェクト管理者権限チェック
    const canAdminProject = await permissionChecker.canAdminProject(user.id, projectId)
    if (!canAdminProject) {
      return NextResponse.json(
        { error: 'このプロジェクトの権限を管理する権限がありません' },
        { status: 403 }
      )
    }

    // 権限レベルの検証
    const validLevels = ['read', 'write', 'admin']
    if (!validLevels.includes(permissionLevel)) {
      return NextResponse.json(
        { error: '無効な権限レベルが指定されています' },
        { status: 400 }
      )
    }

    // 既存の権限チェック
    const { data: existingPermission } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .single()

    if (existingPermission) {
      // 更新
      const { data: updatedPermission, error: updateError } = await supabase
        .from('user_permissions')
        .update({ permission_level: permissionLevel })
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)
        .select()
        .single()

      if (updateError) {
        console.error('Permission update error:', updateError)
        return NextResponse.json(
          { error: '権限の更新に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '権限が正常に更新されました',
        permission: updatedPermission
      })
    } else {
      // 新規作成
      const { data: newPermission, error: createError } = await supabase
        .from('user_permissions')
        .insert([
          {
            project_id: projectId,
            user_id: targetUserId,
            permission_level: permissionLevel
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Permission create error:', createError)
        return NextResponse.json(
          { error: '権限の作成に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: '権限が正常に割り当てられました',
        permission: newPermission
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Project permission create/update API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'プロジェクトIDとユーザーIDが指定されていません' },
        { status: 400 }
      )
    }

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // プロジェクト管理者権限チェック
    const canAdminProject = await permissionChecker.canAdminProject(user.id, projectId)
    if (!canAdminProject) {
      return NextResponse.json(
        { error: 'このプロジェクトの権限を管理する権限がありません' },
        { status: 403 }
      )
    }

    // 権限削除
    const { error: deleteError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Permission deletion error:', deleteError)
      return NextResponse.json(
        { error: '権限の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '権限が正常に削除されました'
    })

  } catch (error) {
    console.error('Project permission deletion API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
