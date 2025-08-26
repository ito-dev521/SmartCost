import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境での詳細エラー表示
  reactStrictMode: true,
  swcMinify: false, // 開発時はminifyを無効化
};

export default nextConfig;
