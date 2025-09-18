import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: 原価エントリー一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 原価エントリーを取得（会社IDでフィルタリング）
    const { data: costEntries, error: costEntriesError } = await supabase
      .from('cost_entries')
      .select(`
        *,
        projects:project_id(name),
        budget_categories:category_id(name)
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    if (costEntriesError) {
      console.error('原価エントリー取得エラー:', costEntriesError)
      return NextResponse.json(
        { error: '原価エントリーの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ costEntries })

  } catch (error) {
    console.error('原価エントリー取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい原価エントリーを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 原価エントリーを作成
    const { data: newEntry, error: insertError } = await supabase
      .from('cost_entries')
      .insert({
        ...body,
        company_id: userData.company_id,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('原価エントリー作成エラー:', insertError)
      return NextResponse.json(
        { error: '原価エントリーの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ costEntry: newEntry })

  } catch (error) {
    console.error('原価エントリー作成エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// PUT: 原価エントリーを更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 原価エントリーを更新
    const { data: updatedEntry, error: updateError } = await supabase
      .from('cost_entries')
      .update({
        ...updateData,
        updated_by: user.id
      })
      .eq('id', id)
      .eq('company_id', userData.company_id) // 会社IDでフィルタリング
      .select()
      .single()

    if (updateError) {
      console.error('原価エントリー更新エラー:', updateError)
      return NextResponse.json(
        { error: '原価エントリーの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ costEntry: updatedEntry })

  } catch (error) {
    console.error('原価エントリー更新エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// DELETE: 原価エントリーを削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 認証されたユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('ユーザー情報取得エラー:', userError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 原価エントリーを削除
    const { error: deleteError } = await supabase
      .from('cost_entries')
      .delete()
      .eq('id', id)
      .eq('company_id', userData.company_id) // 会社IDでフィルタリング

    if (deleteError) {
      console.error('原価エントリー削除エラー:', deleteError)
      return NextResponse.json(
        { error: '原価エントリーの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('原価エントリー削除エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
