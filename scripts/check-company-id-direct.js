const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCompanyIdDirect() {
  try {
    console.log('🔍 company_id要件の直接チェック開始...\n')
    
    // 1. 各テーブルのcompany_idデータ状況確認
    console.log('📋 1. 各テーブルのcompany_idデータ状況:')
    
    const tablesToCheck = [
      'projects',
      'clients', 
      'users',
      'departments',
      'budget_categories',
      'cost_entries',
      'daily_reports',
      'salary_entries',
      'project_progress',
      'caddon_billing',
      'split_billing',
      'bank_balance_history',
      'fiscal_info'
    ]
    
    for (const tableName of tablesToCheck) {
      try {
        // テーブルの存在確認とデータ取得
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`  ❌ ${tableName}: テーブルが存在しないか、アクセスできません - ${error.message}`)
          continue
        }
        
        // データが存在する場合、company_idカラムの状況を確認
        if (data && data.length > 0) {
          const firstRow = data[0]
          const hasCompanyId = 'company_id' in firstRow
          
          if (hasCompanyId) {
            // company_idカラムが存在する場合、データの状況を確認
            const { data: allData, error: allError } = await supabase
              .from(tableName)
              .select('company_id')
            
            if (allError) {
              console.log(`  ❌ ${tableName}: データ取得エラー - ${allError.message}`)
              continue
            }
            
            const totalCount = allData?.length || 0
            const nullCount = allData?.filter(row => row.company_id === null).length || 0
            const nonNullCount = totalCount - nullCount
            
            if (totalCount === 0) {
              console.log(`  📊 ${tableName}: データなし`)
            } else if (nullCount === 0) {
              console.log(`  ✅ ${tableName}: ${totalCount}件すべてにcompany_idが設定済み`)
            } else {
              console.log(`  ⚠️  ${tableName}: ${totalCount}件中${nonNullCount}件にcompany_id設定、${nullCount}件がnull`)
            }
          } else {
            console.log(`  ❌ ${tableName}: company_idカラムが存在しません`)
          }
        } else {
          console.log(`  📊 ${tableName}: データなし`)
        }
        
      } catch (err) {
        console.log(`  ❌ ${tableName}: エラー - ${err.message}`)
      }
    }

    // 2. 特定のテーブルの詳細確認
    console.log('\n📋 2. 特定のテーブルの詳細確認:')
    
    // CADDON請求データの詳細確認
    try {
      const { data: caddonData, error: caddonError } = await supabase
        .from('caddon_billing')
        .select('id, billing_month, company_id')
        .order('billing_month')
      
      if (caddonError) {
        console.log(`  ❌ caddon_billing: ${caddonError.message}`)
      } else {
        console.log(`  📊 caddon_billing: ${caddonData?.length || 0}件`)
        if (caddonData && caddonData.length > 0) {
          caddonData.forEach((billing, index) => {
            const status = billing.company_id ? '✅' : '❌'
            console.log(`    ${index + 1}. ${billing.billing_month}: company_id=${billing.company_id || 'null'} ${status}`)
          })
        }
      }
    } catch (err) {
      console.log(`  ❌ caddon_billing: ${err.message}`)
    }

    // 分割請求データの詳細確認
    try {
      const { data: splitData, error: splitError } = await supabase
        .from('split_billing')
        .select('project_id, billing_month, company_id')
        .order('billing_month')
      
      if (splitError) {
        console.log(`  ❌ split_billing: ${splitError.message}`)
      } else {
        console.log(`  📊 split_billing: ${splitData?.length || 0}件`)
        if (splitData && splitData.length > 0) {
          splitData.forEach((billing, index) => {
            const status = billing.company_id ? '✅' : '❌'
            console.log(`    ${index + 1}. ${billing.billing_month}: company_id=${billing.company_id || 'null'} ${status}`)
          })
        }
      }
    } catch (err) {
      console.log(`  ❌ split_billing: ${err.message}`)
    }

    // 3. 推奨修正事項
    console.log('\n📋 3. 推奨修正事項:')
    console.log('  📝 以下の修正が必要:')
    console.log('    1. company_idがnullのレコードの修正')
    console.log('    2. 新規作成時のcompany_id自動設定')
    console.log('    3. APIルートでのcompany_idフィルタリング確認')
    console.log('    4. フォームコンポーネントでのcompany_id設定確認')
    
    console.log('\n✅ company_id要件の直接チェック完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCompanyIdDirect()
