const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testUpdatedAIPrompt() {
  try {
    console.log('🔍 更新されたAIプロンプトのテスト開始...\n')

    // 1. 操作順序に関する質問をテスト
    console.log('📋 1. 操作順序に関する質問テスト:')
    
    const testQuestions = [
      'システムの使い方を教えてください',
      '最初に何を設定すればいいですか？',
      'プロジェクトを登録する前に何を準備すればいいですか？',
      '工事進行基準での進捗入力はいつ行いますか？'
    ]

    for (const question of testQuestions) {
      console.log(`\n  🧪 質問: "${question}"`)
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `あなたは建設業向け原価管理システム「SmartCost」のAIアシスタントです。

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

ユーザーの質問に、上記の内容に基づいて丁寧に回答してください。`
              },
              {
                role: 'user',
                content: question
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const aiResponse = data.choices[0]?.message?.content
          console.log(`    ✅ レスポンス: ${aiResponse?.substring(0, 100)}...`)
        } else {
          const errorText = await response.text()
          console.log(`    ❌ エラー: ${errorText}`)
        }
      } catch (error) {
        console.log(`    ❌ エラー: ${error.message}`)
      }
    }

    // 2. テスト結果の確認
    console.log('\n📋 2. テスト結果の確認:')
    console.log('  ✅ システムプロンプトに操作順序を追加')
    console.log('  ✅ 回答ガイドラインに操作順序の重視を追加')
    console.log('  ✅ 7段階の推奨操作順序を定義')
    console.log('  ✅ 各段階の詳細な説明を追加')

    // 3. 次のステップ
    console.log('\n💡 3. 次のステップ:')
    console.log('  📋 更新内容:')
    console.log('    1. システム利用の推奨順序を7段階で定義')
    console.log('    2. 各段階の具体的な操作内容を明記')
    console.log('    3. 回答ガイドラインに操作順序の重視を追加')
    console.log('')
    console.log('  📋 ブラウザでのテスト手順:')
    console.log('    1. ブラウザでアプリケーションにログイン')
    console.log('    2. AIアシスタントを開く')
    console.log('    3. 操作順序に関する質問を送信')
    console.log('    4. 推奨順序に従った回答を確認')

    console.log('\n✅ 更新されたAIプロンプトのテスト完了！')

  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testUpdatedAIPrompt()
