import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境での詳細エラー表示
  reactStrictMode: true,

  // Node.jsミドルウェアの有効化
  experimental: {
    nodeMiddleware: true,
  },

  // 環境変数の設定（一時的な対応）
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
  },
};

export default nextConfig;
