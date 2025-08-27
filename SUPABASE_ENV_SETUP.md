# Supabase 環境変数設定ガイド

## 必要な環境変数

`.env.local` ファイルに以下の環境変数を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 環境変数の取得方法

1. **Supabase Dashboard** にアクセス
2. **Settings** → **API** を開く
3. 以下の情報をコピー：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon/public)**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API Key (service_role)**: `SUPABASE_SERVICE_ROLE_KEY`

## 注意点

- `SUPABASE_SERVICE_ROLE_KEY` は非常に重要なキーで、サーバーサイドでのみ使用してください
- このキーはデータベースの完全なアクセス権限を持ちます
- `.env.local` ファイルは `.gitignore` に含まれていることを確認してください










