# 建設原価管理システム

建設コンサルタント向けのクラウド原価管理システムです。Supabase + Vercel環境でReact + Edge Functions + PostgreSQLを使用したモダンなフルスタック開発を行っています。

## 🚀 主要機能

### ✅ 実装済み機能
- **認証システム** - Supabase Auth による安全なログイン/ログアウト
- **ダッシュボード** - プロジェクト概要とAI分析結果の表示
- **プロジェクト管理** - プロジェクトの作成、編集、削除
- **原価入力** - 原価データの入力と管理
- **資金管理** - キャッシュフロー予測と支払い管理
- **レスポンシブデザイン** - モバイル・デスクトップ対応

### 🔄 開発予定機能
- **AI機能** - 予算・原価予測、資金アウト予測、進捗管理AI
- **工事進行基準対応** - 進捗率計算、売上認識処理
- **分析・レポート** - クロス集計、収益性分析
- **Edge Functions** - AI処理、データ分析
- **リアルタイム更新** - Supabase Realtime

## 🛠 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Edge Functions)
- **認証**: Supabase Auth
- **デプロイ**: Vercel
- **UI**: Lucide React Icons, Recharts
- **AI**: OpenAI API (予定)

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント
- Vercelアカウント（デプロイ時）

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd construction-cost-management
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. データベースURLとAPIキーを取得

### 4. データベーススキーマの作成
```bash
# Supabase SQL Editorで以下のファイルを実行
cat database/schema.sql
```

### 5. 環境変数の設定
```bash
# .env.localファイルを作成
touch .env.local
```

`.env.local`に以下の値を設定:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. OpenAI APIキーの設定
AIチャットボット機能を使用するには、OpenAI APIキーが必要です：

1. [OpenAI](https://platform.openai.com/api-keys)でAPIキーを取得
2. `.env.local`ファイルに`OPENAI_API_KEY=your-api-key`を追加
3. 環境変数を設定後、開発サーバーを再起動

### 7. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 📁 プロジェクト構造

```
construction-cost-management/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/         # ダッシュボードページ
│   │   ├── projects/          # プロジェクト管理ページ
│   │   ├── cost-entry/        # 原価入力ページ
│   │   ├── cash-flow/         # 資金管理ページ
│   │   ├── login/             # ログインページ
│   │   └── auth/              # 認証関連ページ
│   ├── components/            # Reactコンポーネント
│   │   ├── auth/              # 認証コンポーネント
│   │   ├── dashboard/         # ダッシュボードコンポーネント
│   │   ├── layout/            # レイアウトコンポーネント
│   │   ├── projects/          # プロジェクト管理コンポーネント
│   │   ├── cost/              # 原価管理コンポーネント
│   │   └── cash-flow/         # 資金管理コンポーネント
│   └── lib/
│       └── supabase.ts        # Supabaseクライアント設定
├── database/
│   └── schema.sql             # データベーススキーマ
└── README.md
```

## 🗄 データベーススキーマ

### 主要テーブル
- `companies` - 会社情報
- `departments` - 部署情報
- `users` - ユーザー情報
- `projects` - プロジェクト管理
- `budget_categories` - 予算科目
- `project_budgets` - プロジェクト予算
- `cost_entries` - 原価エントリー
- `project_progress` - 進捗管理
- `cash_flow_predictions` - キャッシュフロー予測
- `payment_schedule` - 支払いスケジュール
- `ai_predictions` - AI予測結果
- `user_permissions` - アクセス権限

## 🔐 セキュリティ

- **Row Level Security (RLS)** - Supabaseのセキュリティポリシー
- **JWT認証** - セキュアなAPI認証
- **プロジェクトレベル権限** - きめ細かいアクセス制御

## 🚀 デプロイ

### Vercelでのデプロイ
1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ実行

```bash
# Vercel CLIを使用する場合
npm install -g vercel
vercel
```

## 🤖 AI機能（開発予定）

### 予定されているAI機能
- **予算・原価予測AI** - 過去データからのリスク早期警告
- **資金アウト予測AI** - キャッシュフロー予測（3ヶ月先まで）
- **進捗管理AI** - 工程遅延の予兆検知
- **文書処理AI** - 契約書・仕様書の自動データ抽出
- **チャットボット** - 自然言語による業務サポート

## 📊 サンプルデータ

開発・テスト用のサンプルデータが自動的に表示されます：
- サンプルプロジェクト（道路設計業務A、橋梁点検業務B等）
- 予算科目（直接費、間接費、人件費等）
- キャッシュフロー予測データ

## 🐛 トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数が正しく設定されているか確認
   - SupabaseプロジェクトのURLとキーを再確認

2. **認証エラー**
   - Supabaseの認証設定を確認
   - リダイレクトURLが正しく設定されているか確認

3. **データベースエラー**
   - RLSポリシーが正しく設定されているか確認
   - テーブルが正しく作成されているか確認

## 🤝 貢献

1. Forkしてください
2. フィーチャーブランチを作成してください (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットしてください (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュしてください (`git push origin feature/AmazingFeature`)
5. Pull Requestを開いてください

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesでお知らせください。

---

## 🎯 開発ロードマップ

### Phase 1: 基本機能 ✅
- [x] 認証システム
- [x] ダッシュボード
- [x] プロジェクト管理
- [x] 原価入力
- [x] 資金管理

### Phase 2: AI機能 🚧
- [ ] AI予測エンジン
- [ ] Edge Functions実装
- [ ] OpenAI API統合
- [ ] チャットボット

### Phase 3: 高度な機能 📋
- [ ] 工事進行基準対応
- [ ] 分析・レポート機能
- [ ] リアルタイム更新
- [ ] モバイルアプリ

建設コンサルタント業界の原価管理を革新する、AIを活用したモダンなシステムです。