const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addBusinessNumberField() {
  try {
    console.log('🔍 projectsテーブルに業務番号フィールドを追加開始');
    
    // 現在のテーブル構造を確認
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ テーブル確認エラー:', fetchError);
      return;
    }
    
    console.log('📋 現在のテーブル構造（サンプル）:', projects?.[0]);
    
    // 業務番号フィールドが既に存在するかチェック
    if (projects && projects[0] && 'business_number' in projects[0]) {
      console.log('✅ 業務番号フィールドは既に存在します');
      return;
    }
    
    console.log('⚠️ 業務番号フィールドが存在しません。手動で追加してください。');
    console.log('📋 以下のSQLをSupabaseのSQL Editorで実行してください：');
    console.log('');
    console.log('ALTER TABLE projects ADD COLUMN business_number VARCHAR(50);');
    console.log('');
    console.log('または、Supabaseのダッシュボードで：');
    console.log('1. Table Editor → projects → Add Column');
    console.log('2. Name: business_number');
    console.log('3. Type: varchar');
    console.log('4. Length: 50');
    console.log('5. Default Value: 空のまま');
    console.log('6. Is Nullable: チェックを外す（必須フィールドにする場合）');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

addBusinessNumberField();














