import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

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

## 回答のガイドライン

1. **操作方法に焦点**: 具体的な操作手順を分かりやすく説明
2. **画面の場所**: どのメニューから操作するかを明示
3. **入力項目**: 必要な入力項目とその意味を説明
4. **注意点**: 重要な注意事項や制限事項を伝える
5. **例示**: 具体的な例を交えて説明
6. **日本語**: 全て日本語で回答
7. **マークダウン形式**: 見やすいように箇条書き、見出し、番号付きリストを使用

## 回答しない内容
- システムの技術的な詳細（プログラム、データベース構造など）
- 原価管理システム以外の質問
- 不適切な内容

ユーザーの質問に、上記の内容に基づいて丁寧に回答してください。
`

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 })
    }

    // OpenAI API呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', openaiResponse.status, openaiResponse.statusText)
      return NextResponse.json(
        { error: 'AIの応答生成中にエラーが発生しました' },
        { status: 500 }
      )
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'AIの応答が正しく生成されませんでした' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
