'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Calendar, Clock, FileText, Plus, Trash2, Save, Download, AlertCircle } from 'lucide-react'
import DailyReportCalendar from './DailyReportCalendar'

interface DailyReportEntry {
  id?: string
  date: string
  project_id: string
  work_content: string
  work_hours: number
  work_type?: 'hours' | 'time'
  notes: string
  created_at?: string
  updated_at?: string
  user_id?: string
  user_name?: string
  user_email?: string
}

interface Project {
  id: string
  name: string
  client_name?: string
  business_number?: string
}





export default function DailyReportPage() {
  const [entries, setEntries] = useState<DailyReportEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [monthlyReports, setMonthlyReports] = useState<any[]>([])
  const [showMonthlyView, setShowMonthlyView] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM形式
  const [laborCostData, setLaborCostData] = useState<{ hourlyRate: number; projects: any[] } | null>(null)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [deletedEntries, setDeletedEntries] = useState<string[]>([])
  const [workManagementType, setWorkManagementType] = useState<'hours' | 'time'>('hours')
  const [showCalendar, setShowCalendar] = useState(true)
  const [monthlyEntries, setMonthlyEntries] = useState<DailyReportEntry[]>([])
  const [newEntry, setNewEntry] = useState<DailyReportEntry>({
    date: selectedDate,
    project_id: '',
    work_content: '',
    work_hours: 0,
    work_type: 'hours',
    notes: ''
  })
  

  const supabase = createClientComponentClient()

  // 工数管理タイプを取得
  const fetchWorkManagementType = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'work_management_type')
        .single()

      if (!error && data) {
        setWorkManagementType(data.setting_value as 'hours' | 'time')
      }
    } catch (error) {
      console.error('工数管理タイプ取得エラー:', error)
    }
  }

  // 一般管理費プロジェクトの識別子
  const OVERHEAD_PROJECT_NAME = '一般管理費'
  const OVERHEAD_PROJECT_BUSINESS_NUMBER = 'IP'

  // 一般管理費プロジェクトのIDを取得（なければ作成）
  const getOrCreateOverheadProjectId = async (): Promise<string | null> => {
    try {
      // 1) 既存のプロジェクト一覧から検索（クライアント側キャッシュ）
      const foundLocal = projects.find(
        (p) => p.business_number === OVERHEAD_PROJECT_BUSINESS_NUMBER || p.name === OVERHEAD_PROJECT_NAME
      )
      if (foundLocal) {
        return foundLocal.id
      }

      // 2) DBから直接検索
      const { data: existList, error: existErr } = await supabase
        .from('projects')
        .select('id, name, business_number')
        .in('business_number', [OVERHEAD_PROJECT_BUSINESS_NUMBER])
        .limit(1)

      if (!existErr && existList && existList.length > 0) {
        // ステートにも反映
        setProjects((prev) => {
          const already = prev.some((p) => p.id === existList[0].id)
          return already ? prev : [...prev, existList[0] as Project]
        })
        return existList[0].id
      }

      // 3) なければ作成
      const { data: created, error: createErr } = await supabase
        .from('projects')
        .insert({ name: OVERHEAD_PROJECT_NAME, business_number: OVERHEAD_PROJECT_BUSINESS_NUMBER })
        .select('id, name, business_number')
        .single()

      if (createErr || !created) {
        console.warn('一般管理費プロジェクト作成に失敗:', createErr)
        return null
      }

      // ステートに追加
      setProjects((prev) => [...prev, created as Project])
      return created.id as string
    } catch (e) {
      console.warn('一般管理費プロジェクト取得/作成エラー:', e)
      return null
    }
  }

  // プロジェクト毎の工数集計を計算
  const calculateProjectSummary = (reports: any[]) => {
    const projectSummary: { [key: string]: { name: string; business_number: string; totalHours: number; days: number } } = {}

    reports.forEach(monthData => {
      monthData.entries.forEach((entry: any) => {
        const projectKey = entry.project_id || `${entry.business_number}-${entry.project_name}`
        if (!projectSummary[projectKey]) {
          projectSummary[projectKey] = {
            name: entry.project_name || '不明',
            business_number: entry.business_number || '不明',
            totalHours: 0,
            days: 0
          }
        }
        projectSummary[projectKey].totalHours += entry.work_hours || 0
        projectSummary[projectKey].days += 1
      })
    })

    return Object.values(projectSummary).sort((a, b) => b.totalHours - a.totalHours)
  }

  // 時給単価を計算（給与総額 ÷ 総時間）
  const calculateHourlyRate = async (userId: string, periodStart: string, periodEnd: string) => {
    try {
      // salary_entriesから給与データを取得
      const { data: salaryData, error } = await supabase
        .from('salary_entries')
        .select('salary_amount, total_work_hours, hourly_rate')
        .eq('created_by', userId)
        .gte('salary_period_start', periodStart)
        .lte('salary_period_end', periodEnd)
        .order('salary_period_end', { ascending: false })
        .limit(1)
        .single()

      if (error || !salaryData) {
        console.warn('給与データが見つからない:', error)
        return null
      }

      // hourly_rateが既に計算済みの場合
      if (salaryData.hourly_rate) {
        return salaryData.hourly_rate
      }

      // 総時間がない場合は計算できない
      if (!salaryData.total_work_hours || salaryData.total_work_hours <= 0) {
        console.warn('総時間が設定されていない')
        return null
      }

      // 時給単価を計算
      const hourlyRate = salaryData.salary_amount / salaryData.total_work_hours
      return hourlyRate
    } catch (error) {
      console.error('時給単価計算エラー:', error)
      return null
    }
  }

  // プロジェクト毎の人件費を計算
  const calculateLaborCost = async (reports: any[], userId: string, periodStart: string, periodEnd: string) => {
    const hourlyRate = await calculateHourlyRate(userId, periodStart, periodEnd)

    if (!hourlyRate) {
      return null
    }

    const projectSummary: { [key: string]: { name: string; business_number: string; totalHours: number; days: number; laborCost: number } } = {}

    reports.forEach(monthData => {
      monthData.entries.forEach((entry: any) => {
        // 時間管理のエントリーのみ計算
        if (entry.work_type === 'time') {
          const projectKey = entry.project_id || `${entry.business_number}-${entry.project_name}`
          if (!projectSummary[projectKey]) {
            projectSummary[projectKey] = {
              name: entry.project_name || '不明',
              business_number: entry.business_number || '不明',
              totalHours: 0,
              days: 0,
              laborCost: 0
            }
          }
          const workHours = entry.work_hours || 0
          projectSummary[projectKey].totalHours += workHours
          projectSummary[projectKey].days += 1
          projectSummary[projectKey].laborCost += workHours * hourlyRate
        }
      })
    })

    return {
      hourlyRate,
      projects: Object.values(projectSummary).sort((a, b) => b.laborCost - a.laborCost)
    }
  }

  useEffect(() => {
    fetchWorkManagementType()
    fetchProjects()
    
    // 新規エントリー追加フォームが表示されている場合、日付を同期
    if (showNewEntryForm) {
      setNewEntry(prev => ({
        ...prev,
        date: selectedDate
      }))
    }
    
    // 月間データが既に存在する場合は、該当する日付のデータを即座に表示
    if (monthlyEntries.length > 0) {
      const entriesFromMonthly = monthlyEntries.filter(entry => entry.date === selectedDate)
      console.log('選択された日付の月間データ検索結果:', {
        selectedDate,
        monthlyEntriesCount: monthlyEntries.length,
        foundEntries: entriesFromMonthly,
        allDates: monthlyEntries.map(e => e.date)
      })
      
      if (entriesFromMonthly.length > 0) {
        console.log('月間データから該当日付のエントリーを即座に表示:', entriesFromMonthly)
        setEntries(entriesFromMonthly)
        return
      }
    }
    
    // 月間データがない場合や該当する日付のデータがない場合は、通常の取得処理
    fetchDailyReports()
    fetchMonthlyEntries() // カレンダー用の月間データも取得
  }, [selectedDate])

  useEffect(() => {
    if (showMonthlyView) {
      fetchMonthlyReports()
    }
  }, [selectedMonth, showMonthlyView])

  // 作業日報専用のプロジェクト取得（一般管理費を含む）
  const fetchProjects = async () => {
    try {
      console.log('プロジェクト取得開始（作業日報用）...')

      // 現在のユーザーの認証情報を確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('現在のユーザー:', user)
      console.log('ユーザーID:', user?.id)
      console.log('ユーザーメール:', user?.email)
      if (userError) console.error('ユーザー取得エラー:', userError)

      // セッション情報も確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('現在のセッション:', session)
      console.log('アクセストークン:', session?.access_token ? 'あり' : 'なし')
      if (sessionError) console.error('セッション取得エラー:', sessionError)

      // プロジェクト取得（必要なフィールドのみ）
      // プロジェクト一覧を取得（作業日報用なので一般管理費プロジェクトも含む）
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, business_number')
        .order('name')

      if (error) {
        console.error('projectsクエリエラー:', error)
        console.error('エラーコード:', error.code)
        console.error('エラーメッセージ:', error.message)
        console.error('エラーの詳細:', error.details)
        throw error
      }

      console.log('取得した生データ:', data)
      console.log('データ件数:', data?.length || 0)

      // 実際の業務番号を使用
      const projectsWithBusinessNumbers = data?.map((project: any) => ({
        id: project.id,
        name: project.name,
        business_number: project.business_number || 'N/A'
      })) || []

      console.log('加工後のプロジェクトデータ:', projectsWithBusinessNumbers)
      setProjects(projectsWithBusinessNumbers)

      if (projectsWithBusinessNumbers.length === 0) {
        console.warn('警告: プロジェクトデータが空です')
      }
    } catch (error) {
      console.error('プロジェクト取得エラー:', error)
      console.error('エラーの詳細:', error)
      setProjects([]) // エラー時は空配列に設定
    }
  }

  const fetchDailyReports = async () => {
    try {
      console.log('作業日報取得開始...')
      console.log('選択された日付:', selectedDate)

      // まずmonthlyEntriesから該当する日付のデータを探す
      if (monthlyEntries.length > 0) {
        const entriesFromMonthly = monthlyEntries.filter(entry => entry.date === selectedDate)
        console.log('選択された日付の月間データ検索結果:', {
          selectedDate,
          monthlyEntriesCount: monthlyEntries.length,
          foundEntries: entriesFromMonthly,
          allDates: monthlyEntries.map(e => e.date),
          sampleEntries: monthlyEntries.slice(0, 3).map(e => ({ date: e.date, id: e.id }))
        })
        
        if (entriesFromMonthly.length > 0) {
          console.log('月間データから該当日付のエントリーを取得:', entriesFromMonthly)
          setEntries(entriesFromMonthly)
          return
        }
      }

      // monthlyEntriesにない場合は、データベースから直接取得
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*, work_type')
        .eq('date', selectedDate)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('作業日報取得エラー:', error)
        console.error('エラーの詳細:', {
          message: (error as any).message || '不明',
          details: (error as any).details || '不明',
          hint: (error as any).hint || '不明',
          code: (error as any).code || '不明'
        })
        throw error
      }

      console.log('取得した作業日報:', data)

      if (!data || data.length === 0) {
        console.log('日次データがありません')
        setEntries([])
        return
      }

      // 各エントリーのユーザー情報を取得
      const entriesWithUserInfo = await Promise.all(
        data.map(async (entry: any) => {
          let userName = '不明'
          let userEmail = ''
          
          if (entry.user_id) {
            try {
              // usersテーブルからユーザー情報を取得
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', entry.user_id)
                .single()
              
              if (!userError && userData) {
                userName = userData.name || userData.email || '不明'
                userEmail = userData.email || ''
                console.log(`ユーザー情報取得成功: ${entry.user_id} -> ${userName}`)
              } else {
                console.warn('ユーザー情報取得エラー:', userError)
              }
            } catch (userErr) {
              console.warn('ユーザー情報取得例外:', userErr)
            }
          }

          return {
            ...entry,
            user_name: userName,
            user_email: userEmail
          }
        })
      )

      console.log('エントリー情報:', entriesWithUserInfo)
      setEntries(entriesWithUserInfo)
    } catch (error) {
      console.error('作業日報取得エラー:', error)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  // 月間の作業日報を取得（カレンダー表示用）
  const fetchMonthlyEntries = async () => {
    try {
      console.log('月間作業日報取得開始（カレンダー用）...')
      
      // 現在表示中の月の日付範囲を計算
      const currentDate = new Date(selectedDate)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
      const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      
      console.log('カレンダー用日付範囲:', startDate, '〜', endDate)

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*, work_type')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) {
        console.error('月間作業日報取得エラー（カレンダー用）:', error)
        setMonthlyEntries([])
        return
      }

      console.log('カレンダー用月間データ:', data)

      if (!data || data.length === 0) {
        console.log('月間データがありません')
        setMonthlyEntries([])
        return
      }

      // 各エントリーのユーザー情報を取得
      const entriesWithUserInfo = await Promise.all(
        data.map(async (entry: any) => {
          let userName = '不明'
          let userEmail = ''
          
          if (entry.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', entry.user_id)
                .single()
              
              if (!userError && userData) {
                userName = userData.name || userData.email || '不明'
                userEmail = userData.email || ''
              }
            } catch (userErr) {
              console.warn('ユーザー情報取得例外:', userErr)
            }
          }

          return {
            ...entry,
            user_name: userName,
            user_email: userEmail
          }
        })
      )

      console.log('カレンダー用エントリー情報:', entriesWithUserInfo)
      setMonthlyEntries(entriesWithUserInfo)
    } catch (error) {
      console.error('月間作業日報取得エラー（カレンダー用）:', error)
      setMonthlyEntries([])
    }
  }

  const fetchMonthlyReports = async () => {
    try {
      console.log('月次作業日報取得開始...')
      console.log('選択された月:', selectedMonth)

      // 日付範囲の計算
      const startDate = `${selectedMonth}-01`
      const nextMonth = new Date(selectedMonth + '-01')
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const endDate = nextMonth.toISOString().slice(0, 10)

      console.log('日付範囲:', startDate, '〜', endDate)

      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('ユーザー情報が取得できません')
        return
      }
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          work_type,
          projects (
            id,
            name,
            business_number
          )
        `)
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: false })

      if (error) {
        console.error('月次作業日報取得エラー:', error)
        console.error('エラーの詳細:', {
          message: (error as any).message || '不明',
          details: (error as any).details || '不明',
          hint: (error as any).hint || '不明',
          code: (error as any).code || '不明'
        })
        throw error
      }

      console.log('取得した月次作業日報:', data)
      
      if (!data || data.length === 0) {
        console.log('データがありません')
        setMonthlyReports([])
        return
      }
      
      // 日付ごとにグループ化（ユーザー情報を個別取得）
      const groupedByDate: any = {}
      
      for (const report of data) {
        const date = report.date
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        
        // ユーザー情報を個別に取得
        let userName = '不明'
        let userEmail = ''
        
        if (report.user_id) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', report.user_id)
              .single()
            
            if (!userError && userData) {
              userName = userData.name || userData.email || '不明'
              userEmail = userData.email || ''
              console.log(`月次ユーザー情報取得成功: ${report.user_id} -> ${userName}`)
            } else {
              console.warn('月次ユーザー情報取得エラー:', userError)
            }
          } catch (userErr) {
            console.warn('月次ユーザー情報取得例外:', userErr)
          }
        }
        
        groupedByDate[date].push({
          id: report.id,
          date: report.date,
          project_id: report.project_id,
          work_content: report.work_content,
          work_hours: report.work_hours,
          work_type: report.work_type || 'hours',
          notes: report.notes,
          created_at: report.created_at,
          updated_at: report.updated_at,
          project_name: report.projects?.name || '不明',
          business_number: report.projects?.business_number || 'N/A',
          user_name: userName,
          user_email: userEmail
        })
      }

      // 日付順にソート
      const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))
      
      const monthlyData = sortedDates.map(date => ({
        date,
        entries: groupedByDate[date],
        totalHours: groupedByDate[date].reduce((sum: number, entry: any) => sum + (entry.work_hours || 0), 0)
      }))

      console.log('月次データ:', monthlyData)
      setMonthlyReports(monthlyData)

      // 時間管理の場合、人件費計算を行う
      if (workManagementType === 'time' && monthlyData.length > 0) {
        try {
          const laborCostResult = await calculateLaborCost(monthlyData, user.id, startDate, endDate)
          setLaborCostData(laborCostResult)
        } catch (laborError) {
          console.error('人件費計算エラー:', laborError)
          setLaborCostData(null)
        }
      } else {
        setLaborCostData(null)
      }
    } catch (error) {
      console.error('月次作業日報取得エラー:', error)
      console.error('エラーの詳細:', {
        message: (error as any)?.message || '不明',
        details: (error as any)?.details || '不明',
        hint: (error as any)?.hint || '不明',
        code: (error as any)?.code || '不明'
      })
      setMonthlyReports([])
      setLaborCostData(null)
    }
  }

    const addNewEntry = () => {
    // 時間管理の場合、1.0人工の制限を適用しない
    if (workManagementType === 'hours') {
      const totalHours = getTotalHours()
      const newTotal = totalHours + newEntry.work_hours
      // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
      if (newTotal > 1.01) {
        alert(`工数の合計が1.0人工を超えてしまいます。現在の合計: ${totalHours.toFixed(1)}人工、入力値: ${newEntry.work_hours}人工、最大追加可能: ${(1.0 - totalHours).toFixed(1)}人工`)
        return
      }
    }

    if (!newEntry.project_id || newEntry.work_hours <= 0) {
      const fieldName = workManagementType === 'hours' ? '工数' : '時間'
      alert(`プロジェクトと${fieldName}を入力してください。`)
      return
    }

    // 新規エントリーを追加
    const entryToAdd = { ...newEntry, work_type: workManagementType }
    setEntries([entryToAdd, ...entries])

    // 新規エントリーの状態をリセット
    setNewEntry({
      date: selectedDate,
      project_id: '',
      work_content: '',
      work_hours: 0,
      work_type: workManagementType,
      notes: ''
    })
    
    // フォームは非表示にしない（継続して入力可能にする）
    // setShowNewEntryForm(false)
    
    // データベースからの再取得は行わない（ローカルの状態を保持）
    // await fetchDailyReports()
  }

  const updateEntry = (index: number, field: keyof DailyReportEntry, value: any) => {
    const updatedEntries = [...entries]

    if (field === 'work_hours') {
      const newHours = parseFloat(value) || 0

      // 工数管理の場合のみ、1.0人工の制限を適用
      if (workManagementType === 'hours') {
        const otherEntriesTotal = entries.reduce((total, entry, i) => {
          return i === index ? total : total + (entry.work_hours || 0)
        }, 0)
        const maxAllowed = 1.01 - otherEntriesTotal

        if (newHours > maxAllowed) {
          alert(`工数の合計が1.0人工を超えます。最大 ${maxAllowed.toFixed(1)}人工まで入力可能です。`)
          return
        }
      }
    }

    updatedEntries[index] = { ...updatedEntries[index], [field]: value }
    setEntries(updatedEntries)
  }



  const removeEntry = (index: number) => {
    const entryToRemove = entries[index]
    console.log('削除対象エントリー:', entryToRemove)
    
    // 削除対象を削除リストに追加（既存エントリーの場合）
    if (entryToRemove.id) {
      setDeletedEntries(prev => [...prev, entryToRemove.id as string])
    }
    
    const updatedEntries = entries.filter((_, i) => i !== index)
    setEntries(updatedEntries)
  }

  const saveEntries = async () => {
    // 保存前の工数チェック（工数管理の場合のみ）
    if (workManagementType === 'hours') {
      const totalHours = getTotalHours()
      // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
      if (totalHours > 1.01) {
        alert(`工数の合計が1.0人工を超えています。現在の合計: ${totalHours.toFixed(1)}人工です。工数を調整してから保存してください。`)
        return
      }
    }
    
    setIsSaving(true)
    try {
      console.log('保存開始:', entries)
      
      // 現在のユーザー情報を確認
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('保存時のユーザー:', user)
      if (userError) {
        console.error('ユーザー取得エラー:', userError)
        throw userError
      }

      // 削除されたエントリーを処理
      if (deletedEntries.length > 0) {
        console.log('削除対象エントリー:', deletedEntries)
        for (const deletedId of deletedEntries) {
          const { error } = await supabase
            .from('daily_reports')
            .delete()
            .eq('id', deletedId)
            .eq('user_id', user?.id) // 自分のエントリーのみ削除可能

          if (error) {
            console.error('削除エラー:', error)
            console.error('削除エラーの詳細:', error.message)
            throw error
          }
          console.log('削除成功:', deletedId)
        }
      }

      // 既存のエントリーを更新または新規作成
      for (const entry of entries) {
        console.log('処理中のエントリー:', entry)
        
        if (entry.id) {
          // 既存エントリーの更新
          console.log('既存エントリーの更新:', entry.id)
          const { data, error } = await supabase
            .from('daily_reports')
            .update({
              project_id: entry.project_id,
              work_content: entry.work_content,
              work_hours: entry.work_hours,
              work_type: entry.work_type || workManagementType,
              notes: entry.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', entry.id)
            .eq('user_id', user?.id) // 自分のエントリーのみ更新可能

          if (error) {
            console.error('更新エラー:', error)
            console.error('更新エラーの詳細:', error.message)
            throw error
          }
          console.log('更新成功:', data)
        } else {
          // 新規エントリーの作成
          console.log('新規エントリーの作成')
          const insertData = {
            date: entry.date,
            project_id: entry.project_id,
            work_content: entry.work_content,
            work_hours: entry.work_hours,
            work_type: entry.work_type || workManagementType,
            notes: entry.notes,
            user_id: user?.id // ユーザーIDを明示的に追加
          }
          console.log('挿入データ:', insertData)
          
          const { data, error } = await supabase
            .from('daily_reports')
            .insert(insertData)

          if (error) {
            console.error('挿入エラー:', error)
            console.error('挿入エラーの詳細:', error.message)
            console.error('挿入エラーのコード:', error.code)
            throw error
          }
          console.log('挿入成功:', data)
        }
      }



      // 削除リストをクリア
      setDeletedEntries([])

      // 月次表示を日次表示に戻す
      setShowMonthlyView(false)
      
      // 保存完了後にその日の日報を再取得して表示
      await fetchDailyReports()
      
      alert('作業日報が保存されました')
    } catch (error) {
      console.error('保存エラー:', error)
      console.error('保存エラーの詳細:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const exportToCSV = () => {
    if (showMonthlyView && monthlyReports.length > 0) {
      // 月次表示の場合は月次データをCSV出力
      const csvContent = [
        // プロジェクト毎工数集計
        [`=== プロジェクト毎${workManagementType === 'hours' ? '工数' : '時間'}集計 ===`],
        ['業務番号', 'プロジェクト名', `総${workManagementType === 'hours' ? '工数' : '時間'}（${workManagementType === 'hours' ? '人工' : '時間'}）`, '作業日数', `平均${workManagementType === 'hours' ? '工数' : '時間'}/日`],
        ...calculateProjectSummary(monthlyReports).map(project => [
          project.business_number,
          project.name,
          project.totalHours.toFixed(1),
          project.days.toString(),
          (project.totalHours / project.days).toFixed(1)
        ]),
        ['', '', '', '', ''],
        ['合計', `${calculateProjectSummary(monthlyReports).length}件`,
         monthlyReports.reduce((total, monthData) => total + monthData.totalHours, 0).toFixed(1),
         monthlyReports.reduce((total, monthData) => total + monthData.entries.length, 0).toString(),
         ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        // 日別詳細
        ['=== 日別詳細 ==='],
        ['日付', '業務番号', 'プロジェクト名', '作業内容', `${workManagementType === 'hours' ? '工数' : '時間'}（${workManagementType === 'hours' ? '人工' : '時間'}）`, '備考', '入力者'],
        ...monthlyReports.flatMap(monthData => 
          monthData.entries.map((entry: any) => [
            monthData.date,
            entry.business_number || '',
            entry.project_name || '',
            entry.work_content || '',
            (entry.work_hours || 0).toString(),
            entry.notes || '',
            entry.user_name || '不明'
          ])
        )
      ]
      
      const csvString = csvContent.map(row => 
        row.map((cell: any) => `"${cell}"`).join(',')
      ).join('\n')
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${workManagementType === 'hours' ? '作業日報' : '作業時間'}_月次_${selectedMonth}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // 日次表示の場合は従来のCSV出力
      const csvContent = [
        ['日付', '業務番号 - プロジェクト名', '作業内容', `${workManagementType === 'hours' ? '工数' : '時間'}（${workManagementType === 'hours' ? '人工' : '時間'}）`, '備考', '入力者'],
        ...entries.map(entry => {
          const project = projects.find(p => p.id === entry.project_id)
        return [
          entry.date,
          project ? `${project.business_number} - ${project.name}` : '',
          entry.work_content,
          entry.work_hours.toString(),
          entry.notes || '',
          entry.user_name || '不明'
        ]
        })
      ]
      
      const csvString = csvContent.map(row => 
        row.map((field: any) => `"${field}"`).join(',')
      ).join('\n')
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${workManagementType === 'hours' ? '作業日報' : '作業時間'}_日次_${selectedDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getTotalHours = () => {
    return entries.reduce((total, entry) => total + (entry.work_hours || 0), 0)
  }

  const getTotalHoursString = () => {
    return getTotalHours().toFixed(1)
  }

  const getTotalHoursLabel = () => {
    return workManagementType === 'hours' ? '合計工数' : '合計時間'
  }

  const getTotalHoursUnit = () => {
    return workManagementType === 'hours' ? '人工' : '時間'
  }

  const getRemainingHours = () => {
    return Math.max(0, 1.0 - getTotalHours()).toFixed(1)
  }





  if (isLoading) {
  return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-gray-600">データを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {workManagementType === 'hours' ? '作業日報' : '作業時間管理'}
      </h1>
      <p className="text-gray-600">
            {workManagementType === 'hours'
              ? '日々の作業内容と工数を記録・管理します'
              : '日々の作業内容と時間を記録・管理します'
            }
          </p>
        </div>

      {/* アクションボタン */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              作業日報管理
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowMonthlyView(!showMonthlyView)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showMonthlyView
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {showMonthlyView ? `${workManagementType === 'hours' ? '日次' : '日次時間'}表示` : `${workManagementType === 'hours' ? '月次' : '月次時間'}表示`}
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              CSV出力
            </button>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showCalendar ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {showCalendar ? 'カレンダー非表示' : 'カレンダー表示'}
            </button>
          </div>
        </div>

        {/* 合計工数/時間表示 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">{getTotalHoursLabel()}: {getTotalHoursString()}{getTotalHoursUnit()}</span>
            </div>
            {workManagementType === 'hours' && (
              <div className="text-blue-600 text-sm">
                残り: {getRemainingHours()}人工
              </div>
            )}
          </div>

          {workManagementType === 'hours' && getTotalHours() >= 1.0 && (
            <div className="mt-2 text-green-600 text-sm">
              ✅ 工数の合計が1.0人工に達しました
            </div>
          )}
        </div>

        {/* カレンダー表示 */}
        {showCalendar && (
          <div className="mt-4">
            <DailyReportCalendar
              entries={monthlyEntries} // 月間データを使用
              currentDate={new Date(selectedDate)}
              selectedDate={selectedDate} // 選択された日付を渡す
              onDateClick={(date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const dateString = `${year}-${month}-${day}`
          console.log('カレンダーから日付選択:', {
            originalDate: date,
            dateString,
            isoString: date.toISOString().slice(0, 10)
          })
          setSelectedDate(dateString)
        }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}

        {/* 月次表示切り替え */}
        {showMonthlyView && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">月を選択:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* 作業日報エントリー一覧（月次表示時は非表示） */}
      {!showMonthlyView && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {workManagementType === 'hours' ? '作業日報がありません' : '作業時間がありません'}
              </h3>
              <p className="text-gray-500 mb-4">
                選択した日付の{workManagementType === 'hours' ? '作業日報' : '作業時間'}がまだ作成されていません
              </p>
              
              {/* 一般管理費として登録 / 新規エントリー追加ボタン */}
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                {/* 当初の新規エントリー追加（左） */}
                <button
                  onClick={() => {
                    setNewEntry({
                      ...newEntry,
                      date: selectedDate,
                      project_id: ''
                    })
                    setShowNewEntryForm(true)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  新規エントリー追加
                </button>

                {/* 一般管理費として登録（右） */}
                <button
                  onClick={() => {
                    // まず一般管理費プロジェクトIDを取得（なければ作成）
                    getOrCreateOverheadProjectId().then((overheadId) => {
                      // 新規エントリー追加時に選択された日付を設定
                      // 工数管理タイプに応じて初期値を設定
                      const initialWorkHours = workManagementType === 'hours' ? 1.0 : 8.0
                      setNewEntry({
                        ...newEntry,
                        date: selectedDate,
                        project_id: overheadId || '',
                        work_hours: initialWorkHours
                      })
                      setShowNewEntryForm(true)
                    })
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  一般管理費として登録
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                「新規エントリー追加」は自由入力、「一般管理費として登録」はプロジェクトが自動で一般管理費に設定されます。
              </div>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* ユーザー情報表示 */}
                {entry.user_name && entry.user_name !== '不明' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <span className="font-medium">入力者:</span>
                      <span>{entry.user_name}</span>
                      {entry.user_email && entry.user_email !== entry.user_name && (
                        <span className="text-blue-600">({entry.user_email})</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* プロジェクト選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プロジェクト名
                    </label>
                    <select
                      value={entry.project_id}
                      onChange={(e) => updateEntry(index, 'project_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">プロジェクトを選択</option>
                      {projects.length === 0 ? (
                        <option value="" disabled>
                          プロジェクトデータがありません
                        </option>
                      ) : (
                        projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.business_number} - {project.name}
                          </option>
                        ))
                      )}
                    </select>
                    {projects.length === 0 && (
                      <div className="mt-1 text-xs text-red-500">
                        ⚠️ プロジェクトデータが取得できませんでした
                      </div>
                    )}
                  </div>

                  {/* 工数/時間入力 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {workManagementType === 'hours' ? '工数（人工）' : '時間（時間）'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={workManagementType === 'hours' ? (() => {
                        const otherEntriesTotal = entries.reduce((total, e, i) => {
                          return i === index ? total : total + (e.work_hours || 0)
                        }, 0)
                        return 1.0 - otherEntriesTotal
                      })() : undefined}
                      step="0.1"
                      value={entry.work_hours}
                      onChange={(e) => updateEntry(index, 'work_hours', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                    {workManagementType === 'hours' && (() => {
                      const otherEntriesTotal = entries.reduce((total, e, i) => {
                        return i === index ? total : total + (e.work_hours || 0)
                      }, 0)
                      const newTotal = otherEntriesTotal + entry.work_hours
                      return newTotal > 1.01
                    })() && (
                      <div className="mt-1 text-xs text-red-500">
                        ⚠️ 工数の合計が1.0人工を超えてしまいます
                      </div>
                    )}

                  </div>

                  {/* 削除ボタン */}
                  <div className="flex items-end">
                    <button
                      onClick={() => removeEntry(index)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </button>
                  </div>
                </div>

                {/* 作業内容 */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作業内容
                  </label>
                  <textarea
                    value={entry.work_content}
                    onChange={(e) => updateEntry(index, 'work_content', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="具体的な作業内容を記入してください"
                  />
                </div>

                {/* 備考 */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    備考
                  </label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateEntry(index, 'notes', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="特記事項があれば記入してください"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}



      {/* 新規入力フォーム（月次表示時は非表示） */}
      {!showMonthlyView && showNewEntryForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">新規エントリー追加</h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* プロジェクト選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名
              </label>
              <select
                value={newEntry.project_id}
                onChange={(e) => setNewEntry({...newEntry, project_id: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">プロジェクトを選択</option>
                {projects.length === 0 ? (
                  <option value="" disabled>
                    プロジェクトデータがありません
                  </option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.business_number} - {project.name}
                    </option>
                  ))
                )}
              </select>
              {projects.length === 0 && (
                <div className="mt-1 text-xs text-red-500">
                  ⚠️ プロジェクトデータが取得できませんでした
                </div>
              )}
            </div>

            {/* 工数/時間入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {workManagementType === 'hours' ? '工数（人工）' : '時間（時間）'}
              </label>
              <input
                type="number"
                min="0"
                max={workManagementType === 'hours' ? 1.01 - getTotalHours() : undefined}
                step="0.1"
                value={newEntry.work_hours}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0

                  if (workManagementType === 'hours') {
                    const totalHours = getTotalHours()
                    const newTotal = totalHours + value

                    // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
                    if (newTotal > 1.01) {
                      alert(`工数の合計が1.0人工を超えてしまいます。現在の合計: ${totalHours.toFixed(1)}人工、入力値: ${value}人工、最大追加可能: ${(1.0 - totalHours).toFixed(1)}人工`)
                      return
                    }
                  }

                  setNewEntry({...newEntry, work_hours: value})
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
              />

              {workManagementType === 'hours' && getTotalHours() + newEntry.work_hours > 1.01 && (
                <div className="mt-1 text-xs text-red-500">
                  ⚠️ 工数の合計が1.0人工を超えてしまいます
                </div>
              )}
            </div>

            {/* 追加ボタン */}
            <div className="flex items-end">
              <button
                onClick={addNewEntry}
                disabled={!newEntry.project_id || newEntry.work_hours <= 0}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  !newEntry.project_id || newEntry.work_hours <= 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Plus className="h-4 w-4" />
                追加
              </button>
            </div>
          </div>

          {/* 作業内容 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業内容
            </label>
            <textarea
              value={newEntry.work_content}
              onChange={(e) => setNewEntry({...newEntry, work_content: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              placeholder="具体的な作業内容を記入してください"
            />
          </div>

          {/* 備考 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考
            </label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="特記事項があれば記入してください"
            />
          </div>
        </div>
      )}

      {/* 月次表示 */}
      {showMonthlyView && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedMonth} の{workManagementType === 'hours' ? '作業日報' : '作業時間'}一覧
          </h3>
          
          {/* プロジェクト毎の工数/時間集計 */}
          {monthlyReports.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                プロジェクト毎{workManagementType === 'hours' ? '工数' : '時間'}集計
              </h4>

              {/* 時間管理の場合、時給単価を表示 */}
              {workManagementType === 'time' && laborCostData && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-green-800">
                    <span className="font-medium">時給単価:</span>
                    <span className="text-lg font-bold">{laborCostData.hourlyRate.toLocaleString()}円/時間</span>
                    <span className="text-sm text-green-600">
                      （給与総額を総時間で割った値）
                    </span>
                  </div>
                </div>
              )}

              {/* 時間管理の場合、給与データが見つからない場合の警告 */}
              {workManagementType === 'time' && !laborCostData && monthlyReports.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        人件費計算に必要な給与データが見つかりません
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          時間管理モードでは、給与入力で設定された給与総額と総時間から時給単価を計算し、
                          各プロジェクトの人件費を算出します。給与データを入力してください。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        業務番号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        プロジェクト名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        総{workManagementType === 'hours' ? '工数（人工）' : '時間（時間）'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        作業日数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        平均{workManagementType === 'hours' ? '工数' : '時間'}/日
                      </th>
                      {workManagementType === 'time' && laborCostData && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          人件費（円）
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {calculateProjectSummary(monthlyReports).map((project, index) => {
                      // 時間管理の場合、人件費データを探す
                      const laborCostProject = workManagementType === 'time' && laborCostData
                        ? laborCostData.projects.find(p => p.business_number === project.business_number && p.name === project.name)
                        : null

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                            {project.business_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                            {project.name}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600 border-b border-gray-200">
                            {project.totalHours.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                            {project.days}日
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                            {(project.totalHours / project.days).toFixed(1)}
                          </td>
                          {workManagementType === 'time' && laborCostData && (
                            <td className="px-4 py-3 text-sm font-medium text-green-600 border-b border-gray-200">
                              {laborCostProject ? laborCostProject.laborCost.toLocaleString() : '-'}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 border-t border-gray-200">
                        合計
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
                        {calculateProjectSummary(monthlyReports).length}件
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600 border-t border-gray-200">
                        {monthlyReports.reduce((total, monthData) =>
                          total + monthData.totalHours, 0
                        ).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
                        {monthlyReports.reduce((total, monthData) =>
                          total + monthData.entries.length, 0
                        )}日
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
                        -
                      </td>
                      {workManagementType === 'time' && laborCostData && (
                        <td className="px-4 py-3 text-sm font-bold text-green-600 border-t border-gray-200">
                          {laborCostData.projects.reduce((total, project) => total + project.laborCost, 0).toLocaleString()}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          {monthlyReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              選択した月の{workManagementType === 'hours' ? '作業日報' : '作業時間'}がありません
            </div>
          ) : (
            <div className="space-y-6">
              {monthlyReports.map((monthData) => (
                <div key={monthData.date} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {new Date(monthData.date).toLocaleDateString('ja-JP', { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h4>
                    <span className="text-sm font-medium text-blue-600">
                      合計: {monthData.totalHours.toFixed(1)}{getTotalHoursUnit()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {monthData.entries.map((entry: any, index: number) => (
                      <div key={entry.id || index} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {entry.business_number} - {entry.project_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {entry.work_hours}{getTotalHoursUnit()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {entry.work_content || '-'}
                        </div>
                        {entry.user_name && entry.user_name !== '不明' && (
                          <div className="text-xs text-blue-600 mb-1">
                            入力者: {entry.user_name}
                            {entry.created_at && (
                              <span className="ml-2 text-blue-500">
                                ({new Date(entry.created_at).toLocaleString('ja-JP')})
                              </span>
                            )}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-xs text-gray-500">
                            備考: {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 保存ボタン（月次表示時は非表示） */}
      {!showMonthlyView && entries.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveEntries}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {isSaving ? '保存中...' : `${workManagementType === 'hours' ? '作業日報' : '作業時間'}を保存`}
          </button>
        </div>
      )}
    </div>
  )
}
