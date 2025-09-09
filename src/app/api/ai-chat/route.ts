import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// システムプロンプト - 原価管理システムに特化
const SYSTEM_PROMPT = `
あなたは建設業向け原価管理システム「SmartCost」のAIアシスタントです。
以下の機能について、ユーザーの質問に丁寧で分かりやすく回答してください。

## システムの主要機能

### 1. プロジェクト管理
- プロジェクトの作成・編集・削除
- 業務番号、プロジェクト名、発注者名の管理
- プロジェクトステータス（計画中、進行中、完了、保留中、中止）の管理
- 契約金額、開始日、終了日の設定

### 2. 原価入力
- プロジェクト別原価入力（直接費・間接費）
- 一般管理費入力
- 予算科目（カテゴリ）別の原価管理
- 原価エントリの編集・削除

### 3. 作業日報管理
- 日別作業内容の記録
- プロジェクト別工数管理
- 時間管理（15分刻み）と工数管理（0.1刻み）の切り替え
- 月次・日次表示の切り替え

### 4. 給与配分
- 月次給与の入力
- プロジェクト別給与配分
- 一般管理費への配分
- 人工×8時間での単価計算

### 5. 分析・レポート
- 総合成績分析（総収益、利益率、原価構成比）
- プロジェクト別収益性分析
- カテゴリ別原価分析
- 年間入金予定表（CSV・PDFエクスポート）

### 6. 分割入金管理
- プロジェクト別の月次分割入金設定
- 年間入金予定表での表示
- 分割入金データの保存・読み込み

### 7. 管理者機能
- 決算月設定
- 工数管理タイプ設定（時間管理・人工管理）
- 部署管理
- ユーザー管理

### 8. CADDONシステム連携
- CADDONシステムの専用管理
- CADDONプロジェクトの特別処理

## システム利用の推奨順序

システムを効率的に利用するため、以下の順序で操作することを推奨します：

### 1. 初期設定（管理者パネル）
- **決算情報設定**: 決算年度、決算月の設定
- **銀行残高設定**: 初期残高の入力
- **部署管理**: 会社の部署構成の設定

### 2. ユーザー管理
- **社員登録**: システム利用者の追加
- **権限設定**: 各ユーザーの役割（管理者、一般ユーザー、閲覧者）の設定

### 3. クライアント管理
- **クライアント登録**: 発注者・顧客情報の登録
- **支払い条件設定**: 支払いサイクル、支払い日の設定

### 4. プロジェクト管理
- **プロジェクト登録**: 業務番号、プロジェクト名、契約金額の入力
- **プロジェクト詳細**: 開始日、終了日、ステータスの設定

### 5. 日常業務データ入力
- **作業日報**: 日別の作業内容と工数記録
- **原価入力**: プロジェクト別の直接費・間接費入力
- **給与入力**: 月次給与とプロジェクト別配分

### 6. 進捗管理（工事進行基準）
- **進捗入力**: プロジェクトの進捗率と工事進行基準での収益認識
- **進捗確認**: 計画対実績の比較

### 7. 分析・レポート・資金管理
- **原価管理確認**: 総合成績分析、プロジェクト別収益性分析
- **資金管理**: キャッシュフロー予測、年間入金予定表
- **レポート出力**: CSV・PDF形式でのデータエクスポート

## 回答のガイドライン

1. **操作順序の重視**: 上記の推奨順序に従って回答し、適切な段階での操作を案内
2. **操作方法に焦点**: 具体的な操作手順を分かりやすく説明
3. **画面の場所**: どのメニューから操作するかを明示
4. **入力項目**: 必要な入力項目とその意味を説明
5. **注意点**: 重要な注意事項や制限事項を伝える
6. **例示**: 具体的な例を交えて説明
7. **日本語**: 全て日本語で回答
8. **マークダウン形式**: 見やすいように箇条書き、見出し、番号付きリストを使用

## 回答しない内容
- システムの技術的な詳細（プログラム、データベース構造など）
- 原価管理システム以外の質問
- 不適切な内容

ユーザーの質問に、上記の内容に基づいて丁寧に回答してください。
`

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 /api/ai-chat: AIチャットリクエスト受信')
    console.log('🔍 /api/ai-chat: リクエストURL:', request.url)
    console.log('🔍 /api/ai-chat: リクエストメソッド:', request.method)
    console.log('🔍 /api/ai-chat: リクエストヘッダー:', Object.fromEntries(request.headers.entries()))
    
    // 認証チェック - 複数の方法で認証を試行
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('🍪 /api/ai-chat: クッキー情報:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // セッションを取得して認証状態を確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ /api/ai-chat: セッション取得エラー:', sessionError)
      return NextResponse.json({ 
        error: 'セッションの取得に失敗しました。ページを再読み込みしてください。', 
        details: sessionError.message 
      }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ /api/ai-chat: セッションが存在しません')
      return NextResponse.json({ 
        error: 'ログインが必要です。ログインページで認証してください。' 
      }, { status: 401 })
    }
    
    const user = session.user
    if (!user) {
      console.error('❌ /api/ai-chat: ユーザー情報が取得できません')
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました。再ログインしてください。' 
      }, { status: 401 })
    }

    console.log('👤 /api/ai-chat: 認証済みユーザー:', user.id)

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 })
    }

    console.log('💬 /api/ai-chat: メッセージ受信:', message)

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ /api/ai-chat: OpenAI APIキーが設定されていません')
      return NextResponse.json({ error: 'AIサービスが利用できません' }, { status: 500 })
    }

    console.log('🤖 /api/ai-chat: OpenAI API呼び出し開始')
    console.log('🤖 /api/ai-chat: OpenAI APIキー存在確認:', !!process.env.OPENAI_API_KEY)
    console.log('🤖 /api/ai-chat: リクエストボディ:', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'SYSTEM_PROMPT' },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    // OpenAI API呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    console.log('📡 /api/ai-chat: OpenAI APIレスポンス:', {
      status: openaiResponse.status,
      statusText: openaiResponse.statusText,
      ok: openaiResponse.ok,
      headers: Object.fromEntries(openaiResponse.headers.entries())
    })

    if (!openaiResponse.ok) {
      console.error('❌ /api/ai-chat: OpenAI API error:', openaiResponse.status, openaiResponse.statusText)
      const errorText = await openaiResponse.text()
      console.error('❌ /api/ai-chat: OpenAI API error details:', errorText)
      return NextResponse.json(
        { error: 'AIの応答生成中にエラーが発生しました', details: errorText },
        { status: 500 }
      )
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content

    if (!response) {
      console.error('❌ /api/ai-chat: AIの応答が正しく生成されませんでした')
      return NextResponse.json(
        { error: 'AIの応答が正しく生成されませんでした' },
        { status: 500 }
      )
    }

    console.log('✅ /api/ai-chat: AI応答生成成功')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('❌ /api/ai-chat: 予期しないエラー:', error)
    console.error('❌ /api/ai-chat: エラースタック:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
