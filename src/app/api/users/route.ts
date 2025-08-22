import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { permissionChecker } from '@/lib/permissions'
import { User } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/users: GETリクエスト受信')

    // AuthorizationヘッダーからJWTトークンを取得
    const authHeader = request.headers.get('authorization')
    console.log('🔑 /api/users: Authorizationヘッダー:', authHeader ? '存在' : 'なし')

    let userId = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWTトークンからユーザーIDを取得
      const token = authHeader.substring(7)
      try {
        // JWTデコード（簡易版）
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        userId = payload.sub
        console.log('👤 /api/users: JWTから取得したユーザーID:', userId)
      } catch (error) {
        console.error('❌ /api/users: JWTデコードエラー:', error)
      }
    }

    // クッキーからセッション情報を取得
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader && !userId) {
      console.log('🍪 /api/users: クッキーヘッダーから認証情報を取得')
      // シンプルなSupabaseクライアントを作成
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // クッキーを手動で設定
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split('=')
          acc[name] = value
          return acc
        }, {} as Record<string, string>)

        // sb-access-tokenがあれば使用
        if (cookies['sb-access-token']) {
          try {
            const token = cookies['sb-access-token']
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            userId = payload.sub
            console.log('🍪 /api/users: クッキーから取得したユーザーID:', userId)
          } catch (error) {
            console.error('❌ /api/users: クッキートークンデコードエラー:', error)
          }
        }
      }
    }

    if (!userId) {
      console.error('❌ /api/users: 認証情報なし')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザー情報を取得
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーデータを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ /api/users: ユーザーデータ取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザーデータが見つかりません' },
        { status: 404 }
      )
    }

    console.log('✅ /api/users: 認証成功、ユーザー:', userData.email)

    // 管理者権限チェック（ユーザーのロールを確認）
    console.log('🔍 /api/users: 管理者権限チェック開始', { userId, role: userData.role })
    const isAdmin = userData.role === 'admin'

    if (!isAdmin) {
      console.error('❌ /api/users: 管理者権限なし', { userId, role: userData.role })
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    // ユーザー一覧取得
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { error: 'ユーザーの取得に失敗しました' },
        { status: 500 }
      )
    }

    console.log('✅ /api/users: ユーザー一覧取得成功', users?.length || 0, '件')
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 /api/users: POSTリクエスト受信')

    // AuthorizationヘッダーからJWTトークンを取得
    const authHeader = request.headers.get('authorization')
    console.log('🔑 /api/users: Authorizationヘッダー:', authHeader ? '存在' : 'なし')

    let userId = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWTトークンからユーザーIDを取得
      const token = authHeader.substring(7)
      try {
        // JWTデコード（簡易版）
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        userId = payload.sub
        console.log('👤 /api/users: JWTから取得したユーザーID:', userId)
      } catch (error) {
        console.error('❌ /api/users: JWTデコードエラー:', error)
      }
    }

    // クッキーからセッション情報を取得
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader && !userId) {
      console.log('🍪 /api/users: クッキーヘッダーから認証情報を取得')
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      // sb-access-tokenがあれば使用
      if (cookies['sb-access-token']) {
        try {
          const token = cookies['sb-access-token']
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
          userId = payload.sub
          console.log('🍪 /api/users: クッキーから取得したユーザーID:', userId)
        } catch (error) {
          console.error('❌ /api/users: クッキートークンデコードエラー:', error)
        }
      }
    }

    if (!userId) {
      console.error('❌ /api/users: 認証情報なし')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザー情報を取得
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーデータを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ /api/users: ユーザーデータ取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザーデータが見つかりません' },
        { status: 404 }
      )
    }

    console.log('✅ /api/users: 認証成功、ユーザー:', userData.email)

    // 管理者権限チェック（ユーザーのロールを確認）
    console.log('🔍 /api/users: 管理者権限チェック開始', { userId, role: userData.role })
    const isAdmin = userData.role === 'admin'

    if (!isAdmin) {
      console.error('❌ /api/users: 管理者権限なし', { userId, role: userData.role })
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    // リクエストボディ取得
    const { email, name, role, department_id } = await request.json()

    // バリデーション
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      )
    }

    // ロールの検証
    const validRoles = ['admin', 'manager', 'user', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: '無効なロールが指定されています' },
        { status: 400 }
      )
    }

    // 既存ユーザーチェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      )
    }

    // ユーザー作成
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          role,
          department_id: department_id || null
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'ユーザーの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ユーザーが正常に作成されました',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('User creation API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 /api/users: PUTリクエスト受信')

    // AuthorizationヘッダーからJWTトークンを取得
    const authHeader = request.headers.get('authorization')
    console.log('🔑 /api/users: Authorizationヘッダー:', authHeader ? '存在' : 'なし')

    let userId = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWTトークンからユーザーIDを取得
      const token = authHeader.substring(7)
      try {
        // JWTデコード（簡易版）
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        userId = payload.sub
        console.log('👤 /api/users: JWTから取得したユーザーID:', userId)
      } catch (error) {
        console.error('❌ /api/users: JWTデコードエラー:', error)
      }
    }

    // クッキーからセッション情報を取得
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader && !userId) {
      console.log('🍪 /api/users: クッキーヘッダーから認証情報を取得')
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      // sb-access-tokenがあれば使用
      if (cookies['sb-access-token']) {
        try {
          const token = cookies['sb-access-token']
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
          userId = payload.sub
          console.log('🍪 /api/users: クッキーから取得したユーザーID:', userId)
        } catch (error) {
          console.error('❌ /api/users: クッキートークンデコードエラー:', error)
        }
      }
    }

    if (!userId) {
      console.error('❌ /api/users: 認証情報なし')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザー情報を取得
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // リクエストボディ取得
    const { id, email, name, role, department_id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ユーザーIDが指定されていません' },
        { status: 400 }
      )
    }

    // 編集権限チェック
    const canEdit = await permissionChecker.canEditUser(userId, id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'このユーザーを編集する権限がありません' },
        { status: 403 }
      )
    }

    // 更新データの準備
    const updateData: Partial<User> = {}
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (department_id !== undefined) updateData.department_id = department_id

    // ユーザー更新
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json(
        { error: 'ユーザーの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ユーザーが正常に更新されました',
      user: updatedUser
    })

  } catch (error) {
    console.error('User update API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔍 /api/users: DELETEリクエスト受信')

    // AuthorizationヘッダーからJWTトークンを取得
    const authHeader = request.headers.get('authorization')
    console.log('🔑 /api/users: Authorizationヘッダー:', authHeader ? '存在' : 'なし')

    let currentUserId = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWTトークンからユーザーIDを取得
      const token = authHeader.substring(7)
      try {
        // JWTデコード（簡易版）
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        currentUserId = payload.sub
        console.log('👤 /api/users: JWTから取得したユーザーID:', currentUserId)
      } catch (error) {
        console.error('❌ /api/users: JWTデコードエラー:', error)
      }
    }

    // クッキーからセッション情報を取得
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader && !currentUserId) {
      console.log('🍪 /api/users: クッキーヘッダーから認証情報を取得')
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      // sb-access-tokenがあれば使用
      if (cookies['sb-access-token']) {
        try {
          const token = cookies['sb-access-token']
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
          currentUserId = payload.sub
          console.log('🍪 /api/users: クッキーから取得したユーザーID:', currentUserId)
        } catch (error) {
          console.error('❌ /api/users: クッキートークンデコードエラー:', error)
        }
      }
    }

    if (!currentUserId) {
      console.error('❌ /api/users: 認証情報なし')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('id')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ユーザーIDが指定されていません' },
        { status: 400 }
      )
    }

    // Supabaseクライアントを作成
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 削除権限チェック
    const canDelete = await permissionChecker.canDeleteUser(currentUserId, targetUserId)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'このユーザーを削除する権限がありません' },
        { status: 403 }
      )
    }

    // ユーザー削除
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (deleteError) {
      console.error('User deletion error:', deleteError)
      return NextResponse.json(
        { error: 'ユーザーの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ユーザーが正常に削除されました'
    })

  } catch (error) {
    console.error('User deletion API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
