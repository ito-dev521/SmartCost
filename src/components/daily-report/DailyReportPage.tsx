'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Calendar, Clock, FileText, Plus, Trash2, Save, Download } from 'lucide-react'

interface DailyReportEntry {
  id?: string
  date: string
  project_id: string
  work_content: string
  work_hours: number
  notes: string
  created_at?: string
  updated_at?: string
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
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [deletedEntries, setDeletedEntries] = useState<string[]>([])
  const [newEntry, setNewEntry] = useState<DailyReportEntry>({
    date: new Date().toISOString().slice(0, 10),
    project_id: '',
    work_content: '',
    work_hours: 0,
    notes: ''
  })
  

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProjects()
    fetchDailyReports()
  }, [selectedDate])

  useEffect(() => {
    if (showMonthlyView) {
      fetchMonthlyReports()
    }
  }, [selectedMonth, showMonthlyView])

  const fetchProjects = async () => {
    try {
      console.log('プロジェクト取得開始...')

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
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
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
      
      setEntries(data)
    } catch (error) {
      console.error('作業日報取得エラー:', error)
      setEntries([])
    } finally {
      setIsLoading(false)
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
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
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
      
      // 日付ごとにグループ化
      const groupedByDate = data.reduce((acc: any, report: any) => {
        const date = report.date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push({
          id: report.id,
          date: report.date,
          project_id: report.project_id,
          work_content: report.work_content,
          work_hours: report.work_hours,
          notes: report.notes,
          created_at: report.created_at,
          updated_at: report.updated_at,
          project_name: report.projects?.name || '不明',
          business_number: report.projects?.business_number || 'N/A'
        })
        return acc
      }, {})

      // 日付順にソート
      const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))
      
      const monthlyData = sortedDates.map(date => ({
        date,
        entries: groupedByDate[date],
        totalHours: groupedByDate[date].reduce((sum: number, entry: any) => sum + (entry.work_hours || 0), 0)
      }))

      console.log('月次データ:', monthlyData)
      setMonthlyReports(monthlyData)
    } catch (error) {
      console.error('月次作業日報取得エラー:', error)
      console.error('エラーの詳細:', {
        message: (error as any)?.message || '不明',
        details: (error as any)?.details || '不明',
        hint: (error as any)?.hint || '不明',
        code: (error as any)?.code || '不明'
      })
      setMonthlyReports([])
    }
  }

    const addNewEntry = () => {
    const totalHours = getTotalHours()
    const newTotal = totalHours + newEntry.work_hours
    // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
    if (newTotal > 1.01) {
      alert(`工数の合計が1.0人工を超えてしまいます。現在の合計: ${totalHours.toFixed(1)}人工、入力値: ${newEntry.work_hours}人工、最大追加可能: ${(1.0 - totalHours).toFixed(1)}人工`)
      return
    }
    if (!newEntry.project_id || newEntry.work_hours <= 0) {
      alert('プロジェクトと工数を入力してください。')
      return
    }
    // 新規エントリーを追加
    setEntries([newEntry, ...entries])
    
    // 新規エントリーの状態をリセット
    setNewEntry({
      date: selectedDate,
      project_id: '',
      work_content: '',
      work_hours: 0,
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
      const otherEntriesTotal = entries.reduce((total, entry, i) => {
        return i === index ? total : total + (entry.work_hours || 0)
      }, 0)
      const maxAllowed = 1.01 - otherEntriesTotal

      if (newHours > maxAllowed) {
        alert(`工数の合計が1.0人工を超えます。最大 ${maxAllowed.toFixed(1)}人工まで入力可能です。`)
        return
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
    // 保存前の工数チェック
    const totalHours = getTotalHours()
    // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
    if (totalHours > 1.01) {
      alert(`工数の合計が1.0人工を超えています。現在の合計: ${totalHours.toFixed(1)}人工です。工数を調整してから保存してください。`)
      return
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
              notes: entry.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', entry.id)

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
    const csvContent = [
      ['日付', '業務番号 - プロジェクト名', '作業内容', '工数（人工）', '備考'],
      ...entries.map(entry => {
        const project = projects.find(p => p.id === entry.project_id)
        return [
          entry.date,
          project ? `${project.business_number} - ${project.name}` : '',
          entry.work_content,
          entry.work_hours.toString(),
          entry.notes
        ]
      })
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `作業日報_${selectedDate}.csv`
    link.click()
  }

  const getTotalHours = () => {
    return entries.reduce((total, entry) => total + (entry.work_hours || 0), 0)
  }

  const getTotalHoursString = () => {
    return getTotalHours().toFixed(1)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">作業日報</h1>
        <p className="text-gray-600">日々の作業内容と工数を記録・管理します</p>
      </div>

      {/* 日付選択とアクションボタン */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              {showMonthlyView ? '日次表示' : '月次表示'}
            </button>
            <button
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {showNewEntryForm ? 'フォームを隠す' : '新規エントリー追加'}
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              CSV出力
            </button>
          </div>
        </div>

        {/* 合計工数表示 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">合計工数: {getTotalHoursString()}人工</span>
            </div>
            <div className="text-blue-600 text-sm">
              残り: {getRemainingHours()}人工
            </div>
          </div>

          {getTotalHours() >= 1.0 && (
            <div className="mt-2 text-green-600 text-sm">
              ✅ 工数の合計が1.0人工に達しました
            </div>
          )}
        </div>

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
              <h3 className="text-lg font-medium text-gray-900 mb-2">作業日報がありません</h3>
              <p className="text-gray-500 mb-4">選択した日付の作業日報がまだ作成されていません</p>

            </div>
          ) : (
            entries.map((entry, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

                  {/* 工数入力 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工数（人工）
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={(() => {
                        const otherEntriesTotal = entries.reduce((total, e, i) => {
                          return i === index ? total : total + (e.work_hours || 0)
                        }, 0)
                        return 1.0 - otherEntriesTotal
                      })()}
                      step="0.1"
                      value={entry.work_hours}
                      onChange={(e) => updateEntry(index, 'work_hours', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0"
                    />
                    {(() => {
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

            {/* 工数入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工数（人工）
              </label>
              <input
                type="number"
                min="0"
                max={1.01 - getTotalHours()}
                step="0.1"
                value={newEntry.work_hours}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  const totalHours = getTotalHours()
                  const newTotal = totalHours + value
                  
                  // 浮動小数点数の精度問題を回避するため、0.01の誤差を許容
                  if (newTotal > 1.01) {
                    alert(`工数の合計が1.0人工を超えてしまいます。現在の合計: ${totalHours.toFixed(1)}人工、入力値: ${value}人工、最大追加可能: ${(1.0 - totalHours).toFixed(1)}人工`)
                    return
                  }
                  
                  setNewEntry({...newEntry, work_hours: value})
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
              />

              {getTotalHours() + newEntry.work_hours > 1.01 && (
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
            {selectedMonth} の作業日報一覧
          </h3>
          {monthlyReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              選択した月の作業日報がありません
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
                      合計: {monthData.totalHours.toFixed(1)}人工
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
                            {entry.work_hours}人工
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.work_content || '-'}
                        </div>
                        {entry.notes && (
                          <div className="text-xs text-gray-500 mt-1">
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
            {isSaving ? '保存中...' : '作業日報を保存'}
          </button>
        </div>
      )}
    </div>
  )
}
