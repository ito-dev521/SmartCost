import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// サーバーコンポーネント用Supabaseクライアント
export const createServerComponentClient = (request?: Request) => {
  // サーバー環境でのみクッキーハンドラーを使用
  if (typeof window === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cookies: (() => Promise<{ getAll(): Array<{ name: string; value: string }>; setAll(cookies: Array<{ name: string; value: string; options?: any }>): void }>) | null = null

    try {
      // 動的なインポートを試行
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const nextHeaders = require('next/headers')
      cookies = nextHeaders.cookies
    } catch {
      // fallback: クッキーなし
      cookies = null
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        async getAll() {
          if (cookies) {
            try {
              const cookieStore = await cookies()
              return cookieStore.getAll()
            } catch {
              // APIルートなどでcookies()が利用できない場合
              return []
            }
          }
          return []
        },
        async setAll(cookiesToSet) {
          try {
            if (cookies) {
              const cookieStore = await cookies()
              // Next.jsのcookies APIでは個別のsetメソッドは使用しない
              // 代わりにレスポンスヘッダーを直接操作するか、middlewareを使用
              console.warn('Cookie setting is not supported in this context')
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } else {
    // クライアントサイドではクッキーハンドラーなし
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    })
  }
}

