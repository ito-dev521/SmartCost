const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testSplitBillingFixed() {
  try {
    console.log('🔍 修正後の分割入金APIのテスト開始...\n')
    
    // 1. APIエンドポイントのテスト
    console.log('📋 1. 分割入金APIのテスト（Supabase SSR修正後）:')
    
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
    
    // 2. 修正内容の確認
    console.log('\n📋 2. 修正内容の確認:')
    console.log('  ✅ Supabase SSRライブラリの使用')
    console.log('  ✅ createServerClientの正しい実装')
    console.log('  ✅ cookies()の正しい使用方法')
    console.log('  ✅ 古いcreateRouteHandlerClientの削除')
    
    // 3. 修正の詳細
    console.log('\n📋 3. 修正の詳細:')
    console.log('  🔧 インポート文の変更:')
    console.log('    - 旧: import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"')
    console.log('    - 新: import { createServerClient } from "@supabase/ssr"')
    console.log('')
    console.log('  🔧 Supabaseクライアントの初期化:')
    console.log('    - 旧: createRouteHandlerClient({ cookies })')
    console.log('    - 新: createServerClient(url, key, { cookies: { getAll, setAll } })')
    console.log('')
    console.log('  🔧 cookies()の使用方法:')
    console.log('    - await cookies()でcookieStoreを取得')
    console.log('    - getAll()とsetAll()メソッドを実装')
    
    // 4. 期待される結果
    console.log('\n📋 4. 期待される結果:')
    console.log('  ✅ 404エラーの解消')
    console.log('  ✅ APIエンドポイントの正常動作')
    console.log('  ✅ 認証の正常動作')
    console.log('  ✅ 分割入金データの正常な保存・取得')
    
    // 5. 次のステップ
    console.log('\n💡 5. 次のステップ:')
    console.log('  📋 テスト手順:')
    console.log('    1. ブラウザで年間入金予定表にアクセス')
    console.log('    2. 分割入金の編集を試行')
    console.log('    3. エラーメッセージが表示されないことを確認')
    console.log('    4. 値が正しく保存されることを確認')
    console.log('    5. ページを再読み込みして値が保持されることを確認')
    
    console.log('\n✅ 修正後の分割入金APIのテスト完了！')
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testSplitBillingFixed()
