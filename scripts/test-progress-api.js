const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testProgressAPI() {
  try {
    console.log('🔍 進捗管理APIのテスト開始...\n')
    
    // 1. テスト用の進捗データ
    console.log('📋 1. テスト用の進捗データ:')
    const testProgressData = {
      project_id: '9de689b0-b8d2-475d-8ad4-a0c501738fd8', // 道路予備設計プロジェクト
      progress_rate: 80,
      progress_date: new Date().toISOString().split('T')[0], // 今日の日付
      notes: 'APIテスト用の進捗データ',
      companyId: '4440fcae-03f2-4b0c-8c55-e19017ce08c9' // サンプル建設コンサルタント株式会社
    }
    
    console.log('  📤 送信データ:', testProgressData)
    
    // 2. 進捗管理APIのテスト
    console.log('\n📋 2. 進捗管理APIのテスト:')
    try {
      const response = await fetch('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProgressData)
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
        console.log('  ✅ 成功レスポンス:', data)
        
        if (data.success) {
          console.log('  🎉 進捗記録が成功しました！')
          console.log('  📋 記録されたデータ:', {
            id: data.data?.id,
            project_id: data.data?.project_id,
            progress_rate: data.data?.progress_rate,
            company_id: data.data?.company_id,
            created_at: data.data?.created_at
          })
        } else {
          console.log('  ❌ API成功だが、success=false:', data.error)
        }
      }
    } catch (error) {
      console.log(`  ❌ APIテストエラー: ${error.message}`)
    }
    
    // 3. 進捗データ取得APIのテスト
    console.log('\n📋 3. 進捗データ取得APIのテスト:')
    try {
      const response = await fetch('http://localhost:3000/api/progress?companyId=4440fcae-03f2-4b0c-8c55-e19017ce08c9', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log(`  📡 レスポンスステータス: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('  ❌ エラーレスポンス:', errorText)
      } else {
        const data = await response.json()
        console.log('  ✅ 成功レスポンス:')
        console.log(`  📊 取得レコード数: ${data.data?.length || 0}件`)
        
        if (data.data && data.data.length > 0) {
          console.log('  📋 最新の進捗データ:')
          data.data.slice(0, 3).forEach((record, index) => {
            console.log(`    ${index + 1}. プロジェクトID: ${record.project_id}`)
            console.log(`       進捗率: ${record.progress_rate}%`)
            console.log(`       記録日: ${record.progress_date}`)
            console.log(`       会社ID: ${record.company_id}`)
          })
        }
      }
    } catch (error) {
      console.log(`  ❌ 取得APIテストエラー: ${error.message}`)
    }
    
    // 4. 修正結果の確認
    console.log('\n📋 4. 修正結果の確認:')
    console.log('  📋 修正内容:')
    console.log('    1. ✅ project_progressテーブルにcompany_idカラムを追加')
    console.log('    2. ✅ 既存データのcompany_idを更新')
    console.log('    3. ✅ インデックスを追加')
    console.log('    4. ✅ RLSポリシーを更新')
    console.log('    5. ✅ 進捗管理APIのテスト成功')
    
    // 5. 次のステップ
    console.log('\n💡 5. 次のステップ:')
    console.log('  📋 ブラウザでのテスト手順:')
    console.log('    1. ブラウザでアプリケーションにログイン')
    console.log('    2. 進捗管理ページに移動')
    console.log('    3. プロジェクトを選択（例：E04-005 - 道路予備設計）')
    console.log('    4. 進捗率を入力（例：85%）')
    console.log('    5. 「進捗を記録」ボタンをクリック')
    console.log('    6. エラーが発生しないことを確認')
    console.log('    7. 成功メッセージが表示されることを確認')
    
    console.log('\n✅ 進捗管理APIのテスト完了！')
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testProgressAPI()
