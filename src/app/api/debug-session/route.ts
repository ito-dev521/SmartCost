import { createServerComponentClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerComponentClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message })
    }

    if (!session) {
      return NextResponse.json({ session: false, message: "No session found" })
    }

    // JWT payloadからcustom claimsを取得 (session.user.app_metadata)
    const appMetadata = session.user.app_metadata || {}

    return NextResponse.json({
      session: true,
      userId: session.user.id,
      email: session.user.email,
      companyId: appMetadata.company_id || "未設定",
      userRole: appMetadata.user_role || "未設定",
      fullSession: session
    })
  } catch (err) {
    return NextResponse.json({ error: err.message })
  }
}
