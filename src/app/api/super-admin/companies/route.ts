import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'
import { Company, SuperAdmin } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 認証チェック（実際の認証システムを使用）
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者権限チェック
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者チェック
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    if (!superAdmin) {
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 })
    }

    // 全法人の一覧を取得
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        departments:departments(count),
        users:users(count),
        clients:clients(count),
        projects:projects(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('法人取得エラー:', error)
      return NextResponse.json({ error: '法人の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('法人取得エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 認証チェック
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // スーパー管理者チェック
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    if (!superAdmin) {
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '法人名は必須です' }, { status: 400 })
    }

    // 法人を作成
    const { data: company, error } = await supabase
      .from('companies')
      .insert([{ name: name.trim() }])
      .select()
      .single()

    if (error) {
      console.error('法人作成エラー:', error)
      return NextResponse.json({ error: '法人の作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('法人作成エラー:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}













