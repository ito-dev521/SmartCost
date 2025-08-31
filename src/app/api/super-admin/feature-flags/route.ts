import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-api'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('caddon_enabled')
    .limit(1)
    .single()
  const enabled = (data as any)?.caddon_enabled ?? true
  const res = NextResponse.json({ caddon_enabled: enabled })
  // ミドルウェア用の簡易キャッシュ（クッキー）
  res.cookies.set('caddon_enabled_cache', String(enabled), { sameSite: 'lax' })
  return res
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (typeof body?.caddon_enabled !== 'boolean') {
      return NextResponse.json({ error: 'caddon_enabled(boolean) が必要です' }, { status: 400 })
    }
    const supabase = createClient()
    // 行が無ければinsert、あればupdate（単一行運用想定）
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing?.id) {
      await supabase
        .from('admin_settings')
        .update({ caddon_enabled: body.caddon_enabled, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('admin_settings')
        .insert({ caddon_enabled: body.caddon_enabled })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('caddon_enabled_cache', String(body.caddon_enabled), { sameSite: 'lax' })
    return res
  } catch (e) {
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}


