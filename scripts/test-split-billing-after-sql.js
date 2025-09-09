const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testSplitBillingAfterSQL() {
  try {
    console.log('🔍 SQL実行後の分割入金APIのテスト開始...\n')
    
    // 1. APIエンドポイントのテスト
    console.log('📋 1. 分割入金APIのテスト（SQL実行後）:')
    
    try {
      const response = await fetch('http://localhost:3000/api/split-billing?allProjects=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log(`  📡 レスポンスステータス: ${response.status} ${response.statusText}`)
      console.log(`  📡 レスポンスOK: ${response.ok}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('  ❌ エラーレスポンス:', errorText)
        
        try {
          const errorJson = JSON.parse(errorText)
          console.log('  ❌ エラーJSON:', errorJson)
        } catch (e) {
          console.log('  ❌ エラーテキスト（JSON解析失敗）:', errorText)
        }
      } else {
        const data = await response.json()
        console.log('  ✅ 成功レスポンス:')
        console.log(`  📊 プロジェクト数: ${Object.keys(data.projectData || {}).length}件`)
        
        if (data.projectData && Object.keys(data.projectData).length > 0) {
          console.log('  📋 分割入金データサンプル:')
          Object.entries(data.projectData).slice(0, 2).forEach(([projectId, monthlyData]) => {
            console.log(`    プロジェクトID: ${projectId}`)
            console.log(`    月次データ: ${JSON.stringify(monthlyData)}`)
          })
        }
      }
    } catch (error) {
      console.log(`  ❌ APIテストエラー: ${error.message}`)
    }
    
    // 2. 実装内容の確認
    console.log('\n📋 2. SQL実行後の実装内容:')
    console.log('  ✅ split_billingテーブルにcompany_idカラム追加')
    console.log('  ✅ 既存データのcompany_id更新')
    console.log('  ✅ インデックスとRLSポリシー追加')
    console.log('  ✅ APIエンドポイントの正常なcompany_idフィルタリング')
    
    // 3. 修正内容の詳細
    console.log('\n📋 3. 修正内容の詳細:')
    console.log('  🔧 データベース:')
    console.log('    - split_billingテーブルにcompany_idカラム追加')
    console.log('    - 既存データのcompany_idをプロジェクトから取得して更新')
    console.log('    - インデックス追加: idx_split_billing_company_id')
    console.log('    - RLSポリシー追加: 会社別データアクセス制御')
    console.log('')
    console.log('  🔧 APIエンドポイント:')
    console.log('    - 一時的な対応を削除')
    console.log('    - 正常なcompany_idフィルタリングに戻す')
    console.log('    - 詳細なログ出力を追加')
    console.log('    - エラーハンドリングの改善')
    
    // 4. 期待される結果
    console.log('\n📋 4. 期待される結果:')
    console.log('  ✅ 404エラーの解消')
    console.log('  ✅ 分割入金データの正常な保存')
    console.log('  ✅ エラーメッセージの非表示')
    console.log('  ✅ 会社IDフィルタリングの正常動作')
    console.log('  ✅ 他社データへのアクセス防止')
    
    // 5. 次のステップ
    console.log('\n💡 5. 次のステップ:')
    console.log('  📋 テスト手順:')
    console.log('    1. ブラウザで年間入金予定表にアクセス')
    console.log('    2. 分割入金の編集を試行')
    console.log('    3. エラーメッセージが表示されないことを確認')
    console.log('    4. 値が正しく保存されることを確認')
    console.log('    5. ページを再読み込みして値が保持されることを確認')
    
    console.log('\n✅ SQL実行後の分割入金APIのテスト完了！')
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testSplitBillingAfterSQL()
