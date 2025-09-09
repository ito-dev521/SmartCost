const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSalarySaveError() {
  try {
    console.log('🔍 給与データ保存エラーの調査開始...\n')
    
    // 1. salary_entriesテーブルの構造確認
    console.log('📋 1. salary_entriesテーブルの構造確認:')
    try {
      const { data: testData, error: testError } = await supabase
        .from('salary_entries')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.log(`  ❌ salary_entriesテーブルアクセスエラー: ${testError.message}`)
        return
      }
      
      if (testData && testData.length > 0) {
        const columns = Object.keys(testData[0])
        console.log(`  ✅ salary_entriesテーブル存在、カラム: ${columns.join(', ')}`)
        
        // company_idカラムの存在確認
        const hasCompanyId = columns.includes('company_id')
        console.log(`  📊 company_idカラム: ${hasCompanyId ? '✅ 存在' : '❌ 不存在'}`)
      } else {
        console.log(`  📊 salary_entriesテーブル: データなし`)
      }
    } catch (err) {
      console.log(`  ❌ salary_entriesテーブルエラー: ${err.message}`)
    }

    // 2. salary_allocationsテーブルの構造確認
    console.log('\n📋 2. salary_allocationsテーブルの構造確認:')
    try {
      const { data: testData, error: testError } = await supabase
        .from('salary_allocations')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.log(`  ❌ salary_allocationsテーブルアクセスエラー: ${testError.message}`)
      } else {
        if (testData && testData.length > 0) {
          const columns = Object.keys(testData[0])
          console.log(`  ✅ salary_allocationsテーブル存在、カラム: ${columns.join(', ')}`)
          
          // company_idカラムの存在確認
          const hasCompanyId = columns.includes('company_id')
          console.log(`  📊 company_idカラム: ${hasCompanyId ? '✅ 存在' : '❌ 不存在'}`)
        } else {
          console.log(`  📊 salary_allocationsテーブル: データなし`)
        }
      }
    } catch (err) {
      console.log(`  ❌ salary_allocationsテーブルエラー: ${err.message}`)
    }

    // 3. 既存の給与データ確認
    console.log('\n📋 3. 既存の給与データ確認:')
    try {
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (salaryError) {
        console.log(`  ❌ 給与データ取得エラー: ${salaryError.message}`)
      } else {
        console.log(`  📊 給与データ件数: ${salaryData?.length || 0}件`)
        if (salaryData && salaryData.length > 0) {
          salaryData.forEach((entry, index) => {
            console.log(`    ${index + 1}. ${entry.employee_name} - company_id: ${entry.company_id || 'null'}`)
          })
        }
      }
    } catch (err) {
      console.log(`  ❌ 給与データ確認エラー: ${err.message}`)
    }

    // 4. 給与配分データ確認
    console.log('\n📋 4. 給与配分データ確認:')
    try {
      const { data: allocationData, error: allocationError } = await supabase
        .from('salary_allocations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (allocationError) {
        console.log(`  ❌ 給与配分データ取得エラー: ${allocationError.message}`)
      } else {
        console.log(`  📊 給与配分データ件数: ${allocationData?.length || 0}件`)
        if (allocationData && allocationData.length > 0) {
          allocationData.forEach((allocation, index) => {
            console.log(`    ${index + 1}. プロジェクトID: ${allocation.project_id} - company_id: ${allocation.company_id || 'null'}`)
          })
        }
      }
    } catch (err) {
      console.log(`  ❌ 給与配分データ確認エラー: ${err.message}`)
    }

    // 5. テスト用の給与データ保存
    console.log('\n📋 5. テスト用の給与データ保存:')
    try {
      const testSalaryData = {
        employee_name: 'テストユーザー',
        employee_department: null,
        salary_amount: 300000,
        salary_period_start: '2025-01-01',
        salary_period_end: '2025-01-31',
        total_work_hours: 160,
        hourly_rate: 1875,
        notes: 'テスト用給与データ',
        company_id: '4440fcae-03f2-4b0c-8c55-e19017ce08c9', // サンプル建設コンサルタントのID
        created_by: 'test-user-id'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('salary_entries')
        .insert([testSalaryData])
        .select()
        .single()

      if (insertError) {
        console.log(`  ❌ テスト給与データ保存エラー: ${insertError.message}`)
        console.log(`  📊 エラー詳細:`, insertError)
      } else {
        console.log(`  ✅ テスト給与データ保存成功: ID ${insertData.id}`)
        
        // テストデータを削除
        await supabase
          .from('salary_entries')
          .delete()
          .eq('id', insertData.id)
        console.log(`  🗑️  テストデータを削除しました`)
      }
    } catch (err) {
      console.log(`  ❌ テスト給与データ保存エラー: ${err.message}`)
    }

    console.log('\n✅ 給与データ保存エラーの調査完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

debugSalarySaveError()
