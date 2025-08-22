import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// APIルート用Supabaseクライアント（認証情報取得対応）
export const createApiClient = (token?: string) => {
  if (token) {
    // JWTトークンがある場合は、それを使用してクライアントを作成
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
  } else {
    // サービスロールキーを使用して完全なアクセス権限を持つクライアントを作成
    return createSupabaseClient(supabaseUrl, serviceRoleKey)
  }
}

// 後方互換性のため
export const createClient = createApiClient
