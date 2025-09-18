import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { permissionChecker } from '@/lib/permissions'
import { Client } from '@/types/database'

export async function GET(request: NextRequest) {
  try {

    // Supabaseクライアントを作成
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ /api/clients: 認証が必要')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }


    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ /api/clients: ユーザー情報取得エラー:', userError)
      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
    }

    const companyId = userData.company_id

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ /api/clients: クライアント取得エラー:', error)
      return NextResponse.json({ error: 'クライアントの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('クライアント取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    
    // Supabaseクライアントを作成
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('❌ /api/clients POST: 認証が必要')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }


    // ユーザーの会社IDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ /api/clients POST: ユーザー情報取得エラー:', userError)
      return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
    }

    const companyId = userData.company_id

    const body = await request.json()
    const { 
      name, 
      phone, 
      address, 
      notes,
      payment_cycle_type,
      payment_cycle_closing_day,
      payment_cycle_payment_month_offset,
      payment_cycle_payment_day,
      payment_cycle_description
    } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'クライアント名は必須です' }, { status: 400 })
    }
    
    // クライアントを作成
    const clientData = {
      company_id: companyId, // 現在ログインしているユーザーの会社IDを使用
      name: name.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      payment_cycle_type: payment_cycle_type || 'month_end',
      payment_cycle_closing_day: payment_cycle_closing_day || 31,
      payment_cycle_payment_month_offset: payment_cycle_payment_month_offset || 1,
      payment_cycle_payment_day: payment_cycle_payment_day || 31,
      payment_cycle_description: payment_cycle_description || '',
    }


    const { data: client, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single()

    if (error) {
      console.error('❌ /api/clients POST: クライアント作成エラー:', error)
      return NextResponse.json({ error: 'クライアントの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('クライアント作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
