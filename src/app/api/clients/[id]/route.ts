import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'
import { permissionChecker } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient()

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 権限チェック
    const canViewClients = await permissionChecker.canViewClients(user.id)
    if (!canViewClients) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { id } = params

    // ユーザーの会社IDを取得
    const { data: userData } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', user.id)
      .single()

    if (!userData?.department_id) {
      return NextResponse.json({ error: '部署情報が見つかりません' }, { status: 400 })
    }

    const { data: departmentData } = await supabase
      .from('departments')
      .select('company_id')
      .eq('id', userData.department_id)
      .single()

    if (!departmentData?.company_id) {
      return NextResponse.json({ error: '会社情報が見つかりません' }, { status: 400 })
    }

    // クライアントを取得
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('company_id', departmentData.company_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'クライアントが見つかりません' }, { status: 404 })
      }
      console.error('クライアント取得エラー:', error)
      return NextResponse.json({ error: 'クライアントの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('クライアント取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient()

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 権限チェック（マネージャー以上のみ）
    const isManager = await permissionChecker.isManager(user.id)
    if (!isManager) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name, contact_person, email, phone, address, industry, notes } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'クライアント名は必須です' }, { status: 400 })
    }

    // ユーザーの会社IDを取得
    const { data: userData } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', user.id)
      .single()

    if (!userData?.department_id) {
      return NextResponse.json({ error: '部署情報が見つかりません' }, { status: 400 })
    }

    const { data: departmentData } = await supabase
      .from('departments')
      .select('company_id')
      .eq('id', userData.department_id)
      .single()

    if (!departmentData?.company_id) {
      return NextResponse.json({ error: '会社情報が見つかりません' }, { status: 400 })
    }

    // クライアントを更新
    const updateData = {
      name: name.trim(),
      contact_person: contact_person?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      industry: industry?.trim() || null,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', departmentData.company_id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'クライアントが見つかりません' }, { status: 404 })
      }
      console.error('クライアント更新エラー:', error)
      return NextResponse.json({ error: 'クライアントの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('クライアント更新エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient()

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 権限チェック（管理者のみ）
    const isAdmin = await permissionChecker.isAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { id } = params

    // ユーザーの会社IDを取得
    const { data: userData } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', user.id)
      .single()

    if (!userData?.department_id) {
      return NextResponse.json({ error: '部署情報が見つかりません' }, { status: 400 })
    }

    const { data: departmentData } = await supabase
      .from('departments')
      .select('company_id')
      .eq('id', userData.department_id)
      .single()

    if (!departmentData?.company_id) {
      return NextResponse.json({ error: '会社情報が見つかりません' }, { status: 400 })
    }

    // クライアントを削除
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('company_id', departmentData.company_id)

    if (error) {
      console.error('クライアント削除エラー:', error)
      return NextResponse.json({ error: 'クライアントの削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ message: 'クライアントが削除されました' })
  } catch (error) {
    console.error('クライアント削除エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
