#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDailyReports() {
  try {
    console.log('🔍 作業日報データを確認中...')
    
    // プロジェクトデータを取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, business_number')
    
    if (projectsError) {
      console.error('❌ プロジェクトデータ取得エラー:', projectsError)
      return
    }
    
    // ユーザーデータを取得
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
    
    if (usersError) {
      console.error('❌ ユーザーデータ取得エラー:', usersError)
      return
    }
    
    // プロジェクトとユーザーのマッピングを作成
    const projectMap = {}
    projects.forEach(project => {
      projectMap[project.id] = project
    })
    
    const userMap = {}
    users.forEach(user => {
      userMap[user.id] = user
    })
    
    // 作業日報データを取得
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }
    
    console.log('\n📊 作業日報データ:')
    console.log('総件数:', data.length)
    
    if (data.length > 0) {
      console.log('\n📋 全データ:')
      data.forEach((report, index) => {
        const project = projectMap[report.project_id]
        const user = userMap[report.user_id]
        
        const projectName = project ? `${project.business_number} - ${project.name}` : 'プロジェクト不明'
        const userName = user ? user.name : 'ユーザー不明'
        
        console.log(`${index + 1}. ${report.date} - ${projectName} - ${userName}`)
        console.log(`   作業内容: ${report.work_content}`)
        console.log(`   作業時間: ${report.work_hours}時間`)
        console.log('')
      })
    }
    
    // 8月のデータを確認
    const augustData = data.filter(report => {
      const date = new Date(report.date)
      return date.getMonth() === 7 // 8月（0ベース）
    })
    
    console.log('\n📅 8月のデータ:')
    console.log('件数:', augustData.length)
    
    if (augustData.length > 0) {
      augustData.forEach((report, index) => {
        const project = projectMap[report.project_id]
        const user = userMap[report.user_id]
        
        const projectName = project ? `${project.business_number} - ${project.name}` : 'プロジェクト不明'
        const userName = user ? user.name : 'ユーザー不明'
        
        console.log(`${index + 1}. ${report.date} - ${projectName} - ${userName}`)
      })
    } else {
      console.log('8月のデータが見つかりません')
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkDailyReports()
