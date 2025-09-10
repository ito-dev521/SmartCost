const { createClient } = require('@supabase/supabase-js')

// Supabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBudgetCategories() {
  try {
    console.log('🔍 budget_categoriesテーブルのスキーマを確認中...')
    
    // テーブル構造を確認
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'budget_categories' })
    
    if (columnsError) {
      console.log('📋 カラム情報を直接取得します...')
      
      // 代替方法：実際のデータを取得して構造を推測
      const { data: sampleData, error: sampleError } = await supabase
        .from('budget_categories')
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.error('❌ サンプルデータ取得エラー:', sampleError)
        return
      }
      
      console.log('📋 サンプルデータ構造:', sampleData)
    } else {
      console.log('📋 カラム情報:', columns)
    }
    
    // 既存のデータを確認
    const { data: existingData, error: dataError } = await supabase
      .from('budget_categories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (dataError) {
      console.error('❌ 既存データ取得エラー:', dataError)
    } else {
      console.log('📊 既存データ（最新5件）:', existingData)
    }
    
    // テスト用のデータ挿入を試行
    console.log('🧪 テスト用データ挿入を試行中...')
    
    const testData = {
      name: 'テスト科目_' + Date.now(),
      level: 1,
      parent_id: null,
      sort_order: 999,
      company_id: 'test-company-id'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('budget_categories')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.error('❌ テスト挿入エラー:', insertError)
      console.error('エラー詳細:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
    } else {
      console.log('✅ テスト挿入成功:', insertData)
      
      // テストデータを削除
      const { error: deleteError } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', insertData[0].id)
      
      if (deleteError) {
        console.error('⚠️ テストデータ削除エラー:', deleteError)
      } else {
        console.log('✅ テストデータ削除完了')
      }
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

debugBudgetCategories()
