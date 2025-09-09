const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCompanyIdRequirements() {
  try {
    console.log('🔍 company_id要件の包括的チェック開始...\n')
    
    // 1. データベーステーブルの構造確認
    console.log('📋 1. データベーステーブルの構造確認:')
    
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
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .eq('column_name', 'company_id')
        
        if (error) {
          console.log(`  ❌ ${tableName}: テーブルが存在しないか、アクセスできません`)
          continue
        }
        
        if (data && data.length > 0) {
          const column = data[0]
          console.log(`  ✅ ${tableName}: company_idカラム存在 (${column.data_type}, nullable: ${column.is_nullable})`)
        } else {
          console.log(`  ❌ ${tableName}: company_idカラムが存在しません`)
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: エラー - ${err.message}`)
      }
    }

    // 2. 各テーブルのcompany_idデータ状況確認
    console.log('\n📋 2. 各テーブルのcompany_idデータ状況:')
    
    for (const tableName of tablesToCheck) {
      try {
        // まずテーブルが存在するかチェック
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (testError) {
          console.log(`  ❌ ${tableName}: テーブルが存在しないか、アクセスできません`)
          continue
        }
        
        // company_idカラムの存在確認
        const { data: columnData, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .eq('column_name', 'company_id')
        
        if (columnError || !columnData || columnData.length === 0) {
          console.log(`  ⚠️  ${tableName}: company_idカラムが存在しません`)
          continue
        }
        
        // データの状況確認
        const { data: countData, error: countError } = await supabase
          .from(tableName)
          .select('company_id', { count: 'exact' })
        
        if (countError) {
          console.log(`  ❌ ${tableName}: データ取得エラー - ${countError.message}`)
          continue
        }
        
        const totalCount = countData?.length || 0
        const nullCount = countData?.filter(row => row.company_id === null).length || 0
        const nonNullCount = totalCount - nullCount
        
        if (totalCount === 0) {
          console.log(`  📊 ${tableName}: データなし`)
        } else if (nullCount === 0) {
          console.log(`  ✅ ${tableName}: ${totalCount}件すべてにcompany_idが設定済み`)
        } else {
          console.log(`  ⚠️  ${tableName}: ${totalCount}件中${nonNullCount}件にcompany_id設定、${nullCount}件がnull`)
        }
        
      } catch (err) {
        console.log(`  ❌ ${tableName}: エラー - ${err.message}`)
      }
    }

    // 3. APIルートでのcompany_idフィルタリング確認
    console.log('\n📋 3. APIルートでのcompany_idフィルタリング確認:')
    
    const apiRoutes = [
      '/api/projects',
      '/api/cost-entries', 
      '/api/users',
      '/api/progress',
      '/api/annual-revenue-schedule',
      '/api/split-billing',
      '/api/analytics/progress-cost',
      '/api/cash-flow-prediction',
      '/api/annual-revenue-total',
      '/api/bank-balance-history',
      '/api/fiscal-info'
    ]
    
    for (const route of apiRoutes) {
      try {
        const fs = require('fs')
        const path = require('path')
        const routePath = path.join(process.cwd(), 'src/app', route, 'route.ts')
        
        if (fs.existsSync(routePath)) {
          const content = fs.readFileSync(routePath, 'utf8')
          const hasCompanyIdFilter = content.includes('company_id') && 
                                   (content.includes('.eq(\'company_id\'') || 
                                    content.includes('company_id:') ||
                                    content.includes('userData.company_id'))
          
          if (hasCompanyIdFilter) {
            console.log(`  ✅ ${route}: company_idフィルタリング実装済み`)
          } else {
            console.log(`  ❌ ${route}: company_idフィルタリング未実装`)
          }
        } else {
          console.log(`  ❌ ${route}: ファイルが存在しません`)
        }
      } catch (err) {
        console.log(`  ❌ ${route}: エラー - ${err.message}`)
      }
    }

    // 4. フォームコンポーネントでのcompany_id設定確認
    console.log('\n📋 4. フォームコンポーネントでのcompany_id設定確認:')
    
    const formComponents = [
      'src/components/cost/CostEntryForm.tsx',
      'src/components/caddon/CaddonManagementForm.tsx',
      'src/components/projects/NewProjectForm.tsx',
      'src/components/salary/SalaryEntryForm.tsx',
      'src/components/daily-report/DailyReportPage.tsx',
      'src/components/admin/DepartmentManagement.tsx'
    ]
    
    for (const componentPath of formComponents) {
      try {
        const fs = require('fs')
        const path = require('path')
        const fullPath = path.join(process.cwd(), componentPath)
        
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8')
          const hasCompanyIdSetting = content.includes('company_id') && 
                                    (content.includes('company_id:') ||
                                     content.includes('userData.company_id') ||
                                     content.includes('userCompanyId'))
          
          if (hasCompanyIdSetting) {
            console.log(`  ✅ ${componentPath}: company_id設定実装済み`)
          } else {
            console.log(`  ❌ ${componentPath}: company_id設定未実装`)
          }
        } else {
          console.log(`  ❌ ${componentPath}: ファイルが存在しません`)
        }
      } catch (err) {
        console.log(`  ❌ ${componentPath}: エラー - ${err.message}`)
      }
    }

    // 5. 推奨修正事項
    console.log('\n📋 5. 推奨修正事項:')
    console.log('  📝 以下のテーブルにcompany_idカラムを追加することを推奨:')
    console.log('    - まだcompany_idカラムがないテーブル')
    console.log('    - 既存データのcompany_idを適切に設定')
    console.log('    - APIルートでのcompany_idフィルタリング実装')
    console.log('    - フォームコンポーネントでのcompany_id自動設定')
    
    console.log('\n✅ company_id要件の包括的チェック完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCompanyIdRequirements()
