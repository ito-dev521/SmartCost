import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient()

    const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
    return NextResponse.json({
      error: '認証が必要です',
      debug: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        url: request.url
      }
    }, { status: 401 })
  }

    // スーパー管理者チェック
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    // 現在のスーパー管理者一覧
    const { data: allSuperAdmins } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      user: {
        email: session.user.email,
        id: session.user.id
      },
      isSuperAdmin: !!superAdmin,
      superAdmin: superAdmin,
      allSuperAdmins: allSuperAdmins,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('スーパー管理者テストエラー:', error)
    return NextResponse.json({ error: 'テストエラー' }, { status: 500 })
  }
}
