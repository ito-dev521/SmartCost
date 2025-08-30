#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   .env.local ファイルに NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixCaddonDuplicates() {
  try {
    console.log('🔍 CADDONシステムの重複データを整理中...')
    
    // 1. CADDONシステムのプロジェクトを検索
    const { data: caddonProjects, error } = await supabase
      .from('projects')
      .select('*')
      .or('name.ilike.%CADDON%,business_number.ilike.C%')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    console.log(`📋 CADDONシステムのプロジェクト数: ${caddonProjects?.length || 0}`)
    
    if (!caddonProjects || caddonProjects.length === 0) {
      console.log('✅ CADDONシステムのプロジェクトは見つかりませんでした')
      return
    }

    // 2. プロジェクトの詳細を表示
    console.log('\n📋 現在のCADDONシステムのプロジェクト:')
    caddonProjects.forEach((project, index) => {
      console.log(`\n--- プロジェクト ${index + 1} ---`)
      console.log(`ID: ${project.id}`)
      console.log(`名前: ${project.name}`)
      console.log(`業務番号: ${project.business_number || '未設定'}`)
      console.log(`クライアント名: ${project.client_name || '未設定'}`)
      console.log(`契約金額: ${project.contract_amount || '未設定'}`)
      console.log(`作成日: ${project.created_at}`)
    })

    // 3. 重複データの整理方針を決定
    if (caddonProjects.length === 1) {
      console.log('\n✅ CADDONシステムのプロジェクトは1つのみです')
      return
    }

    // 4. 最古のプロジェクト（元からある方）を特定
    const oldestProject = caddonProjects[0]
    const otherProjects = caddonProjects.slice(1)

    console.log('\n🔧 重複データの整理方針:')
    console.log(`✅ 保持するプロジェクト: ${oldestProject.name} (ID: ${oldestProject.id})`)
    console.log(`❌ 削除するプロジェクト: ${otherProjects.length}件`)

    // 5. 最古のプロジェクトに業務番号C001を設定（まだ設定されていない場合）
    if (!oldestProject.business_number || oldestProject.business_number !== 'C001') {
      console.log('\n📝 最古のプロジェクトに業務番号C001を設定中...')
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ business_number: 'C001' })
        .eq('id', oldestProject.id)

      if (updateError) {
        console.error('❌ 業務番号の更新に失敗:', updateError)
        return
      }

      console.log('✅ 業務番号C001を設定しました')
    } else {
      console.log('\n✅ 最古のプロジェクトには既に業務番号C001が設定されています')
    }

    // 6. 重複するプロジェクトを削除
    console.log('\n🗑️ 重複するプロジェクトを削除中...')
    
    for (const project of otherProjects) {
      console.log(`削除中: ${project.name} (ID: ${project.id})`)
      
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (deleteError) {
        console.error(`❌ プロジェクト ${project.name} の削除に失敗:`, deleteError)
      } else {
        console.log(`✅ プロジェクト ${project.name} を削除しました`)
      }
    }

    // 7. 最終確認
    console.log('\n🔍 整理後の確認...')
    const { data: finalProjects, error: finalError } = await supabase
      .from('projects')
      .select('*')
      .or('name.ilike.%CADDON%,business_number.ilike.C%')

    if (finalError) {
      console.error('❌ 最終確認でエラー:', finalError)
      return
    }

    console.log(`📋 整理後のCADDONシステムのプロジェクト数: ${finalProjects?.length || 0}`)
    
    if (finalProjects && finalProjects.length > 0) {
      console.log('\n📋 整理後のCADDONシステムのプロジェクト:')
      finalProjects.forEach((project, index) => {
        console.log(`\n--- プロジェクト ${index + 1} ---`)
        console.log(`ID: ${project.id}`)
        console.log(`名前: ${project.name}`)
        console.log(`業務番号: ${project.business_number || '未設定'}`)
        console.log(`クライアント名: ${project.client_name || '未設定'}`)
        console.log(`契約金額: ${project.contract_amount || '未設定'}`)
        console.log(`作成日: ${project.created_at}`)
      })
    }

    console.log('\n✅ CADDONシステムの重複データの整理が完了しました')

  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error)
  }
}

fixCaddonDuplicates()
