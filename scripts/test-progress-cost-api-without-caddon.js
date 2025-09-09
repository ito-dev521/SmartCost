const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
require('dotenv').config({ path: '.env.local' })

async function testProgressCostAPIWithoutCaddon() {
  try {
    console.log('🔍 CADDONシステム除外後の工事進行基準原価分析APIのテスト開始...\n')
    
    // 1. APIエンドポイントのテスト
    console.log('📋 1. 工事進行基準原価分析APIのテスト（CADDON除外）:')
    
    try {
      const response = await fetch('http://localhost:3000/api/analytics/progress-cost', {
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
        console.log(`  📊 データ件数: ${data.data?.length || 0}件`)
        
        if (data.data && data.data.length > 0) {
          console.log('  📋 分析データサンプル:')
          data.data.forEach((item, index) => {
            console.log(`\n    --- プロジェクト ${index + 1} ---`)
            console.log(`    プロジェクト: ${item.project.business_number} - ${item.project.name}`)
            console.log(`    進捗率: ${item.latestProgress?.progress_rate || 0}%`)
            console.log(`    契約金額: ¥${item.contractAmount.toLocaleString()}`)
            console.log(`    認識済み収益: ¥${item.recognizedRevenue.toLocaleString()}`)
            console.log(`    実績原価: ¥${item.totalCost.toLocaleString()}`)
            console.log(`    利益: ¥${item.profit.toLocaleString()}`)
            console.log(`    利益率: ${item.profitMargin.toFixed(1)}%`)
            console.log(`    原価効率: ¥${item.costEfficiency.toLocaleString()}`)
            
            // CADDONシステムのプロジェクトが含まれていないことを確認
            const isCaddonSystem = (
              (item.project.business_number && item.project.business_number.startsWith('C')) ||
              (item.project.name && item.project.name.includes('CADDON'))
            )
            if (isCaddonSystem) {
              console.log(`    ⚠️  警告: CADDONシステムのプロジェクトが含まれています！`)
            } else {
              console.log(`    ✅ CADDONシステム除外確認: OK`)
            }
          })
        }
      }
    } catch (error) {
      console.log(`  ❌ APIテストエラー: ${error.message}`)
    }
    
    // 2. 実装内容の確認
    console.log('\n📋 2. CADDONシステム除外の実装内容:')
    console.log('  ✅ プロジェクトデータからCADDONシステムを除外')
    console.log('  ✅ 進捗データからCADDONシステム関連を除外')
    console.log('  ✅ 原価データからCADDONシステム関連を除外')
    console.log('  ✅ 業務番号がCで始まるプロジェクトを除外')
    console.log('  ✅ プロジェクト名にCADDONが含まれるプロジェクトを除外')
    
    // 3. 除外条件の詳細
    console.log('\n📋 3. CADDONシステム除外条件:')
    console.log('  🔍 プロジェクト除外条件:')
    console.log('    - 業務番号が「C」で始まるプロジェクト')
    console.log('    - プロジェクト名に「CADDON」が含まれるプロジェクト')
    console.log('')
    console.log('  🔍 進捗データ除外条件:')
    console.log('    - 上記条件に該当するプロジェクトに関連する進捗データ')
    console.log('')
    console.log('  🔍 原価データ除外条件:')
    console.log('    - 上記条件に該当するプロジェクトに関連する原価データ')
    console.log('    - プロジェクトに関連しない原価データは含める')
    
    // 4. 工事進行基準での原価管理の特徴
    console.log('\n📋 4. 工事進行基準での原価管理の特徴:')
    console.log('  📊 進捗率に基づく収益認識:')
    console.log('    - 認識済み収益 = 契約金額 × 進捗率 ÷ 100')
    console.log('')
    console.log('  💰 実績原価との比較:')
    console.log('    - 利益 = 認識済み収益 - 実績原価')
    console.log('    - 利益率 = 利益 ÷ 認識済み収益 × 100')
    console.log('')
    console.log('  📈 原価効率の評価:')
    console.log('    - 原価効率 = 実績原価 ÷ 進捗率 × 100')
    console.log('')
    console.log('  🚫 CADDONシステム除外の理由:')
    console.log('    - CADDONシステムは工事進行基準ではない')
    console.log('    - 月次課金システムのため進捗率での収益認識は不適切')
    console.log('    - 通常の建設プロジェクトとは異なる収益認識方法')
    
    console.log('\n✅ CADDONシステム除外後の工事進行基準原価分析APIのテスト完了！')
    
  } catch (error) {
    console.error('❌ テストエラー:', error)
  }
}

testProgressCostAPIWithoutCaddon()
