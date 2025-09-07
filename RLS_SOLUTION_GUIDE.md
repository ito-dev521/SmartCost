# RLS無限再帰問題 解決ガイド

## 🚨 問題の症状
- コンソールに `infinite recursion detected in policy for relation "users"` エラーが多発
- 管理者ページや各種ページでアクセス権限チェックが失敗
- ページの表示が正常に動作しない

## 🔍 原因分析
1. **無限再帰の発生**: `users`テーブルのRLSポリシーが自分自身を参照してcompany_idを取得しようとしている
2. **JWT custom claimsの未設定**: `auth.jwt() ->> 'company_id'`が利用できない状態
3. **循環依存**: 複数のテーブルが`users`テーブルを参照するRLSポリシーを持っている

## 📋 作成した修正スクリプト

### 1. 緊急修正用（即座に問題解決）
**ファイル**: `database/emergency_fix_rls_recursion.sql`
- 無限再帰を起こすポリシーを削除
- 一時的に認証済みユーザー全員にアクセスを許可
- アプリケーション層でcompany_idフィルタリングを実装

### 2. 長期的解決策（セキュリティ重視）
**ファイル**: `database/setup_jwt_custom_claims.sql`
- JWT custom claimsでcompany_idを設定
- ログイン時に自動的にJWTにcompany_idを含める
- 安全なcompany_id制限つきRLSポリシー

### 3. テスト・検証用
**ファイル**: `scripts/test-rls-fix.js`
- 修正後のRLS動作をテスト
- 無限再帰エラーの解決を確認

## 🔧 実行手順

### ⚡ 緊急対応（今すぐエラーを止める）
```sql
-- 1. SupabaseのSQL Editorで実行
-- database/emergency_fix_rls_recursion.sql の内容を実行
```

### 🧪 修正確認
```bash
# 2. テストスクリプトでエラーが解決されたか確認
node scripts/test-rls-fix.js
```

### 🔒 長期的対応（推奨：セキュリティ強化）
```sql
-- 3. JWT custom claimsを設定（オプション）
-- database/setup_jwt_custom_claims.sql の内容を実行
-- Supabaseダッシュボードでcustom access token hookを設定
```

## ✅ 期待される結果
1. **即座の効果**:
   - コンソールエラー `infinite recursion detected` が停止
   - 管理者ページが正常に表示される
   - 各ページの権限チェックが動作する

2. **長期的効果**（JWT custom claims実装後）:
   - 適切なcompany_id制限つきRLS
   - セキュリティレベルの向上
   - スケーラブルな権限管理

## ⚠️ 注意点
- 緊急修正ではセキュリティレベルが一時的に低下します
- アプリケーション層でのcompany_idフィルタリングが必要です
- 本番環境では長期的解決策の実装を強く推奨します

## 🔄 ロールバック方法
```sql
-- 問題が発生した場合、RLSを完全に無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- ... 他のテーブルも同様
```

## 📞 サポート
修正後もエラーが続く場合は、以下をチェックしてください：
1. Supabaseのログを確認
2. ブラウザのコンソールログを確認
3. アプリケーションの再起動
4. データベース接続の再確立

修正が完了したら、この問題の根本原因であったRLSポリシーの設計を見直すことをお勧めします。

