'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { Save, Calculator, Users, AlertCircle, TrendingUp } from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  business_number?: string
  created_at: string
  updated_at: string
}

type BudgetCategory = Tables<'budget_categories'>

interface SalaryEntryForm {
  employee_name: string
  employee_department: string
  salary_amount: number
  salary_period_start: string
  salary_period_end: string
  notes: string
}

interface ProjectAllocation {
  project_id: string
  work_hours: number
  hourly_rate: number
  labor_cost: number
}

interface User {
  id: string
  name: string
  department_id: string | null
  departments: {
    name: string
  } | null
}

interface Department {
  id: string
  name: string
}

interface SalaryEntryFormProps {
  initialUsers: User[]
  initialDepartments: Department[]
  initialProjects: Project[]
  initialCategories: BudgetCategory[]
}

export default function SalaryEntryForm({
  initialUsers,
  initialDepartments,
  initialProjects,
  initialCategories
}: SalaryEntryFormProps) {
  // デバッグ用ログ

  const [users] = useState<User[]>(initialUsers)
  const [departments] = useState<Department[]>(initialDepartments)
  const [projects] = useState<Project[]>(initialProjects)
  const [categories] = useState<BudgetCategory[]>(initialCategories)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM形式（現在月）

  // 選択された月から期間を自動計算
  const getPeriodFromMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number)
    
    // より確実な方法で日付を計算（タイムゾーンの影響を避ける）
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    // ローカルタイムゾーンでの日付を取得
    const startYear = startDate.getFullYear()
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0')
    const startDay = String(startDate.getDate()).padStart(2, '0')
    
    const endYear = endDate.getFullYear()
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
    const endDay = String(endDate.getDate()).padStart(2, '0')
    
    const start = `${startYear}-${startMonth}-${startDay}`
    const end = `${endYear}-${endMonth}-${endDay}`
    
    // デバッグ用ログ
    
    return { start, end }
  }

  const selectedPeriod = getPeriodFromMonth(selectedMonth)

  // 給与入力フォームデータ
  const [salaryForm, setSalaryForm] = useState({
    employee_name: '',
    employee_department: '',
    salary_amount: 0,
    salary_period_start: new Date().toISOString().slice(0, 10),
    salary_period_end: new Date().toISOString().slice(0, 10),
    notes: ''
  })


  const [laborCosts, setLaborCosts] = useState<{
    project_id: string
    project_name: string
    business_number: string
    work_hours: number
    hourly_rate: number
    labor_cost: number
    category_id: string
  }[]>([])

  const [workManagementType, setWorkManagementType] = useState<'hours' | 'time'>('hours')

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

  // コンポーネントマウント時に工数管理タイプを取得
  useEffect(() => {
    fetchWorkManagementType()
    fetchSalaryEntries() // 給与データも取得
  }, [])

  // 給与エントリー一覧を取得
  const fetchSalaryEntries = async () => {
    setLoadingEntries(true)
    try {
      const { data, error } = await supabase
        .from('salary_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('給与データ取得エラー:', error)
        return
      }

      setSalaryEntries(data || [])
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('給与データ取得エラー:', error)
    } finally {
      setLoadingEntries(false)
    }
  }

  // 給与エントリーを編集
  const handleEdit = (entry: any) => {
    setEditingEntry(entry)
    // フォームに値を設定
    setSalaryForm({
      employee_name: entry.employee_name,
      employee_department: entry.employee_department || '',
      salary_amount: entry.salary_amount,
      salary_period_start: entry.salary_period_start,
      salary_period_end: entry.salary_period_end,
      notes: entry.notes || ''
    })
    // 期間を設定
    const periodStart = new Date(entry.salary_period_start)
    const yearMonth = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(yearMonth)
  }

  // 給与エントリーを削除
  const handleDelete = async (entry: any) => {
    if (!confirm(`「${entry.employee_name}」の給与データを削除しますか？\nこの操作は取り消せません。`)) {
      return
    }

    setDeletingEntry(entry)
    try {
      // 関連するデータも削除
      const { error: allocationError } = await supabase
        .from('salary_allocations')
        .delete()
        .eq('salary_entry_id', entry.id)

      if (allocationError) {
        console.error('給与配分削除エラー:', allocationError)
      }

      // 給与エントリーを削除
      const { error: entryError } = await supabase
        .from('salary_entries')
        .delete()
        .eq('id', entry.id)

      if (entryError) {
        throw entryError
      }

      alert('給与データを削除しました')
      await fetchSalaryEntries() // 一覧を更新
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setDeletingEntry(null)
    }
  }

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setEditingEntry(null)
    // フォームをリセット
    setSalaryForm({
      employee_name: '',
      employee_department: '',
      salary_amount: 0,
      salary_period_start: new Date().toISOString().slice(0, 10),
      salary_period_end: new Date().toISOString().slice(0, 10),
      notes: ''
    })
    setSelectedMonth(new Date().toISOString().slice(0, 7))
    setLaborCosts([])
    setOverheadHours(0)
    setOverheadLaborCost(0)
  }

  // 工数データを取得してプロジェクト配分を計算
  const calculateProjectAllocations = async () => {
    if (!salaryForm.employee_name || !selectedPeriod.start || !selectedPeriod.end) {
      alert('社員名と期間を選択してください')
      return
    }

    setCalculating(true)
    try {

      // 指定期間の作業日報データを取得
      let dailyReports: any[] = []
      let error: any = null

      try {
        // 選択した社員のユーザーIDを取得
        const selectedUser = users.find(user => user.name === salaryForm.employee_name)
        if (!selectedUser) {
          alert('選択した社員の情報が見つかりません')
          return
        }

        // daily_reportsテーブルから選択した社員のデータのみを取得
        const result = await supabase
          .from('daily_reports')
          .select('*')
          .gte('date', selectedPeriod.start)
          .lte('date', selectedPeriod.end)
          .eq('user_id', selectedUser.id) // 選択した社員のデータのみ取得

        dailyReports = result.data || []
        error = result.error

        if (process.env.NODE_ENV === 'development') {
          console.log('daily_reports取得結果:', {
            selectedUser: selectedUser.name,
            selectedUserId: selectedUser.id,
            count: dailyReports.length,
            sampleData: dailyReports[0],
            error: error?.message
          })
        }

        // プロジェクト情報を個別に取得
        if (dailyReports.length > 0) {
          const projectIds = [...new Set(dailyReports.map(report => report.project_id).filter(Boolean))]
          if (process.env.NODE_ENV === 'development') {
            console.log('取得するプロジェクトID:', projectIds)
          }

          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('id, name, business_number')
            .in('id', projectIds)

          console.log('プロジェクト情報取得結果:', {
            projectData,
            projectError: projectError?.message
          })

          // プロジェクト情報をdailyReportsにマージ
          dailyReports = dailyReports.map(report => ({
            ...report,
            projects: projectData?.find(p => p.id === report.project_id) || { name: '不明', business_number: '' }
          }))

          if (projectError) {
            console.warn('プロジェクト情報取得でエラーが発生しましたが、処理を続行します:', projectError)
          }
        }

      } catch (tableError) {
        console.log('daily_reportsテーブルアクセスエラー:', tableError)
        // エラーの場合は、サンプルデータを使用
        dailyReports = []
        error = null
      }

      console.log('作業日報データ取得結果:', {
        dailyReports,
        error: error?.message,
        count: dailyReports?.length || 0
      })

      if (error) {
        console.error('作業日報データ取得エラー:', error)
        throw error
      }

      if (!dailyReports || dailyReports.length === 0) {
        // 選択した社員の作業日報データがない場合のメッセージ
        console.log('選択した社員の作業日報データがありません')
        alert(`${salaryForm.employee_name}さんの${selectedPeriod.start}～${selectedPeriod.end}期間の作業日報データがありません。\n作業日報を入力してから給与計算を行ってください。`)
        return
      }

      // プロジェクト毎の工数集計（一般管理費は別途集計）
      const projectHours: { [key: string]: { project: { name: string, business_number?: string }, totalHours: number } } = {}
      let overheadHours = 0 // 一般管理費の工数

      dailyReports.forEach(report => {
        const projectKey = report.project_id
        if (!projectKey) {
          console.log('project_idがnullのレポートをスキップ:', report)
          return
        }

        const project = report.projects as { name: string, business_number?: string }
        
        // 一般管理費プロジェクトは別途集計
        if (project.name === '一般管理費' || project.business_number === 'IP') {
          console.log('一般管理費プロジェクトを別途集計:', project)
          overheadHours += report.work_hours || 0
          return
        }

        if (!projectHours[projectKey]) {
          projectHours[projectKey] = {
            project: project,
            totalHours: 0
          }
        }
        projectHours[projectKey].totalHours += report.work_hours || 0
      })

      console.log('一般管理費工数:', overheadHours)
      setOverheadHours(overheadHours) // 状態を更新

      console.log('プロジェクト毎の工数集計結果:', projectHours)

      // 総工数を計算（一般管理費も含む）
      const projectWorkHours = Object.values(projectHours).reduce((sum, item) => sum + item.totalHours, 0)
      const totalHours = projectWorkHours + overheadHours // 一般管理費も含む

      console.log('総工数計算結果:', {
        totalHours,
        projectCount: Object.keys(projectHours).length
      })

      if (totalHours === 0) {
        alert('指定期間に作業日報データがありません')
        return
      }

      // 工数管理タイプに応じて時給単価を計算
      let hourlyRate: number
      if (workManagementType === 'time') {
        // 時間管理の場合：給与総額 ÷ 総時間
        hourlyRate = salaryForm.salary_amount / totalHours
      } else {
        // 工数管理の場合：給与総額 ÷ 総工数（人工）→ 人工×8時間で時間に戻して計算
        const totalHoursInTime = totalHours * 8 // 人工を8時間に変換
        hourlyRate = salaryForm.salary_amount / totalHoursInTime
      }

      const totalHoursForCalculation = workManagementType === 'time' ? totalHours : totalHours * 8 // 人工管理の場合は8時間に変換
      console.log('時給単価計算結果:', {
        salaryAmount: salaryForm.salary_amount,
        totalHours,
        totalHoursForCalculation,
        hourlyRate,
        workManagementType
      })

      // プロジェクト毎の人件費を計算
      const allocations: ProjectAllocation[] = Object.entries(projectHours).map(([projectId, data]) => {
        const workHours = workManagementType === 'time' ? data.totalHours : data.totalHours * 8 // 人工管理の場合は8時間に変換
        const laborCost = workHours * hourlyRate
        return {
          project_id: projectId,
          work_hours: workHours, // 時間ベースで保存
          hourly_rate: hourlyRate,
          labor_cost: laborCost
        }
      })

      // 一般管理費の人件費を計算
      const overheadWorkHours = workManagementType === 'time' ? overheadHours : overheadHours * 8 // 人工管理の場合は8時間に変換
      const overheadLaborCost = overheadWorkHours * hourlyRate

      console.log('プロジェクト配分計算結果:', allocations)
      console.log('一般管理費人件費:', { overheadHours, hourlyRate, overheadLaborCost })
      setOverheadLaborCost(overheadLaborCost) // 状態を更新



      // 人件費カテゴリを取得
      const laborCostCategory = categories.find(cat => 
        cat.name.includes('人件費') || 
        (cat.level === 1 && cat.name.includes('直接費'))
      )
      
      if (!laborCostCategory) {
        alert('人件費カテゴリが見つかりません。管理者パネルで原価科目を設定してください。')
        return
      }

      console.log('使用する人件費カテゴリ:', laborCostCategory)

      // プロジェクト毎の人件費データを生成
      const costs = allocations.map(allocation => {
        const project = projects.find(p => p.id === allocation.project_id)
        const cost = {
          project_id: allocation.project_id,
          project_name: project?.name || '不明',
          business_number: project?.business_number || '',
          work_hours: allocation.work_hours,
          hourly_rate: allocation.hourly_rate,
          labor_cost: allocation.labor_cost,
          category_id: laborCostCategory.id
        }
        console.log('プロジェクト人件費データ:', cost)
        return cost
      })

      console.log('最終的な人件費データ:', costs)
      setLaborCosts(costs)

    } catch (error) {
      console.error('プロジェクト配分計算エラー:', error)
      if (error instanceof Error) {
        console.error('エラーの詳細:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
        alert(`プロジェクト配分の計算に失敗しました: ${error.message}`)
      } else {
        alert('プロジェクト配分の計算に失敗しました')
      }
    } finally {
      setCalculating(false)
    }
  }

  // 給与データを保存
  const saveSalaryData = async () => {
    console.log('💾 給与データ保存開始:', { laborCosts, salaryForm, selectedPeriod })
    
    if (laborCosts.length === 0) {
      alert('まずプロジェクト配分を計算してください')
      return
    }

    // データの検証
    const invalidCosts = laborCosts.filter(cost => 
      !cost.project_id || cost.project_id.trim() === '' ||
      !cost.category_id || cost.category_id.trim() === ''
    )
    
    if (invalidCosts.length > 0) {
      console.error('❌ 無効なデータ:', invalidCosts)
      alert('プロジェクトIDまたはカテゴリIDが無効です。プロジェクト配分を再計算してください。')
      return
    }

    setSaving(true)
    try {
      // 現在のユーザーの会社IDを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('ユーザー取得エラー:', userError)
        alert('ユーザー情報の取得に失敗しました')
        return
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData) {
        console.error('ユーザー会社ID取得エラー:', userDataError)
        alert('会社情報の取得に失敗しました')
        return
      }

      const currentUserId = user.id

      // 1. 給与エントリーを保存（配分結果と同じ値を保存）
      const totalWorkHours = laborCosts.reduce((sum, cost) => sum + cost.work_hours, 0)
      const totalWorkHoursWithOverhead = totalWorkHours + overheadHours // 一般管理費も含む総工数
      const hourlyRate = totalWorkHoursWithOverhead > 0 ? salaryForm.salary_amount / totalWorkHoursWithOverhead : 0
      
      const salaryEntryData = {
        employee_name: salaryForm.employee_name,
        employee_department: salaryForm.employee_department || null,
        salary_amount: salaryForm.salary_amount,
        salary_period_start: selectedPeriod.start,
        salary_period_end: selectedPeriod.end,
        total_work_hours: totalWorkHoursWithOverhead, // 配分結果と同じ総工数
        hourly_rate: hourlyRate, // 配分結果と同じ時給単価
        notes: `${salaryForm.notes || ''} (配分結果: 総工数${totalWorkHoursWithOverhead}時間, 時給¥${hourlyRate.toLocaleString()}, 一般管理費¥${overheadLaborCost.toLocaleString()})`.trim(),
        company_id: userData.company_id,
        created_by: currentUserId
      }

      let salaryEntry
      let salaryError

      if (editingEntry) {
        // 編集モード：更新
        const { data, error } = await supabase
          .from('salary_entries')
          .update(salaryEntryData)
          .eq('id', editingEntry.id)
          .select()
          .single()
        salaryEntry = data
        salaryError = error
      } else {
        // 新規作成モード：挿入
        const { data, error } = await supabase
          .from('salary_entries')
          .insert([salaryEntryData])
          .select()
          .single()
        salaryEntry = data
        salaryError = error
      }

      if (salaryError) throw salaryError

      // 2. 給与配分を保存
      const salaryAllocations = laborCosts.map(cost => {
        // UUIDの検証
        if (!cost.project_id || cost.project_id.trim() === '') {
          throw new Error(`プロジェクトIDが無効です: ${cost.project_id}`)
        }
        if (!cost.category_id || cost.category_id.trim() === '') {
          throw new Error(`カテゴリIDが無効です: ${cost.category_id}`)
        }
        
        return {
          salary_entry_id: salaryEntry.id,
          project_id: cost.project_id,
          work_hours: cost.work_hours,
          hourly_rate: cost.hourly_rate,
          labor_cost: cost.labor_cost,
          company_id: userData.company_id
        }
      })

      const { error: allocationError } = await supabase
        .from('salary_allocations')
        .insert(salaryAllocations)

      if (allocationError) throw allocationError

      // 3. プロジェクト原価としてcost_entriesにも保存
      const costEntries = laborCosts.map(cost => {
        // UUIDの検証
        if (!cost.project_id || cost.project_id.trim() === '') {
          throw new Error(`プロジェクトIDが無効です: ${cost.project_id}`)
        }
        if (!cost.category_id || cost.category_id.trim() === '') {
          throw new Error(`カテゴリIDが無効です: ${cost.category_id}`)
        }
        
        return {
          project_id: cost.project_id,
          category_id: cost.category_id,
          entry_date: selectedPeriod.end, // 期間の終了日を原価発生日とする
          amount: cost.labor_cost,
          description: `${salaryForm.employee_name}の人件費（${workManagementType === 'hours' ? '工数' : '時間'}管理、${selectedPeriod.start}～${selectedPeriod.end}）`,
          entry_type: 'direct',
          company_id: userData.company_id,
          created_by: currentUserId
        }
      })

      const { error: costError } = await supabase
        .from('cost_entries')
        .insert(costEntries)

      if (costError) throw costError

      alert(editingEntry ? '給与データを更新しました' : '給与データとプロジェクト人件費データを保存しました')

      // 給与データを再取得
      await fetchSalaryEntries()

      // フォームをリセット
      setLaborCosts([])
      setOverheadHours(0)
      setOverheadLaborCost(0)
      setSalaryForm({
        employee_name: '',
        employee_department: '',
        salary_amount: 0,
        salary_period_start: new Date().toISOString().slice(0, 10),
        salary_period_end: new Date().toISOString().slice(0, 10),
        notes: ''
      })
      setSelectedMonth(new Date().toISOString().slice(0, 7))
      setEditingEntry(null) // 編集モードを解除

    } catch (error) {
      console.error('保存エラー:', error)
      
      // 詳細なエラー情報を表示
      let errorMessage = 'データの保存に失敗しました'
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage += `\n\nエラー詳細: ${error.message}`
        }
        if ('code' in error) {
          errorMessage += `\nエラーコード: ${error.code}`
        }
        if ('details' in error) {
          errorMessage += `\n詳細: ${error.details}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // 現在のユーザーIDを取得
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      throw new Error('ユーザーIDが取得できません')
    }
    return user.id
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalLaborCost = laborCosts.reduce((sum, cost) => sum + cost.labor_cost, 0)
  const totalWorkHours = laborCosts.reduce((sum, cost) => sum + cost.work_hours, 0)
  const [overheadHours, setOverheadHours] = useState(0) // 一般管理費の工数
  const [overheadLaborCost, setOverheadLaborCost] = useState(0) // 一般管理費の人件費
  const [salaryEntries, setSalaryEntries] = useState<any[]>([]) // 給与エントリー一覧
  const [loadingEntries, setLoadingEntries] = useState(false) // 給与データ読み込み中
  const [editingEntry, setEditingEntry] = useState<any>(null) // 編集中のエントリー
  const [deletingEntry, setDeletingEntry] = useState<any>(null) // 削除中のエントリー

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">給与入力</h1>
        <p className="mt-1 text-sm text-gray-500">
          給与を入力して作業日報の{workManagementType === 'hours' ? '工数' : '時間'}に基づきプロジェクト毎の人件費を計算・保存します
          <span className="ml-2 text-xs text-blue-600">
            （{workManagementType === 'hours' ? '工数管理' : '時間管理'}モード）
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 給与入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              {editingEntry ? '給与情報編集' : '給与情報入力'}
            </h2>
          </div>
          {editingEntry && (
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              編集キャンセル
            </button>
          )}
        </div>

          <form className="space-y-6">
            {/* 社員情報 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                  社員名 <span className="text-red-500">*</span>
                </label>
                <select
                  id="employee_name"
                  value={salaryForm.employee_name}
                  onChange={(e) => {
                    const selectedUser = users.find(user => user.name === e.target.value)
                    setSalaryForm({ 
                      ...salaryForm, 
                      employee_name: e.target.value,
                      employee_department: selectedUser?.departments?.name || ''
                    })
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">社員を選択してください</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="employee_department" className="block text-sm font-medium text-gray-700">
                  部署
                </label>
                <input
                  type="text"
                  id="employee_department"
                  value={salaryForm.employee_department}
                  onChange={(e) => setSalaryForm({...salaryForm, employee_department: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="部署が自動入力されます"
                  readOnly
                />
              </div>
            </div>

            {/* 給与額 */}
            <div>
              <label htmlFor="salary_amount" className="block text-sm font-medium text-gray-700">
                給与総額（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="salary_amount"
                value={salaryForm.salary_amount === 0 ? '' : salaryForm.salary_amount.toLocaleString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[,\s]/g, '')
                  const parsedValue = parseInt(numericValue) || 0
                  setSalaryForm({...salaryForm, salary_amount: parsedValue})
                }}
                onBlur={(e) => {
                  if (salaryForm.salary_amount > 0) {
                    e.target.value = salaryForm.salary_amount.toLocaleString()
                  }
                }}
                onFocus={(e) => {
                  if (salaryForm.salary_amount > 0) {
                    e.target.value = salaryForm.salary_amount.toString()
                  }
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="1,000,000"
              />
            </div>

            {/* 期間設定 */}
            <div>
              <label htmlFor="period_month" className="block text-sm font-medium text-gray-700">
                対象月 <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                id="period_month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                期間: {selectedMonth ? `${selectedPeriod.start.split('-')[2]}日 ～ ${selectedPeriod.end.split('-')[2]}日` : '月を選択してください'}
              </p>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                id="notes"
                rows={3}
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="特記事項があれば入力してください"
              />
            </div>

            {/* 計算ボタン */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={calculateProjectAllocations}
                disabled={calculating || !salaryForm.employee_name || !salaryForm.salary_amount}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {calculating ? '計算中...' : 'プロジェクト配分を計算'}
              </button>
            </div>
          </form>
        </div>

        {/* 計算結果 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              プロジェクト配分結果
              {salaryForm.employee_name && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({salaryForm.employee_name}さん)
                </span>
              )}
            </h2>
          </div>

          {laborCosts.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                給与情報を入力して「プロジェクト配分を計算」をクリックしてください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 集計情報 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="text-center">
                    <div className="text-sm text-blue-600">総{workManagementType === 'time' ? '時間' : '工数'}</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {(totalWorkHours + overheadHours).toFixed(1)}{workManagementType === 'time' ? '時間' : '人工'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">時給単価</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(salaryForm.salary_amount / (totalWorkHours + overheadHours))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">プロジェクト人件費</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(totalLaborCost)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">一般管理費{workManagementType === 'time' ? '時間' : '工数'}</div>
                    <div className="text-lg font-semibold text-gray-600">
                      {overheadHours.toFixed(1)}{workManagementType === 'time' ? '時間' : '人工'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">一般管理費人件費</div>
                    <div className="text-lg font-semibold text-gray-600">
                      {formatCurrency(overheadLaborCost)}
                    </div>
                  </div>
                </div>
              </div>

              {/* プロジェクト別内訳 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">プロジェクト別内訳</h3>
                {laborCosts.map((cost, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {cost.project_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {workManagementType === 'time' ? '時間' : '工数'}: {cost.work_hours.toFixed(1)}{workManagementType === 'time' ? '時間' : '人工'} × 時給: {formatCurrency(cost.hourly_rate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(cost.labor_cost)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 保存ボタン */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveSalaryData}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : (editingEntry ? '給与データを更新' : '給与データを保存')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 給与データ一覧 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">給与データ一覧</h2>
          </div>
          <button
            onClick={fetchSalaryEntries}
            disabled={loadingEntries}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loadingEntries ? '更新中...' : '更新'}
          </button>
        </div>

        {loadingEntries ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">給与データを読み込み中...</p>
          </div>
        ) : salaryEntries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">給与データがありません</p>
            <p className="text-xs text-gray-400">給与を入力して保存すると、ここに表示されます</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    社員名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部署
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    給与総額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    総工数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時給単価
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    一般管理費
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    入力日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryEntries.map((entry, index) => (
                  <tr key={entry.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.employee_department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.salary_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.salary_period_start} ～ {entry.salary_period_end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* 配分結果と同じ値を表示 */}
                      {entry.total_work_hours?.toFixed(1) || '-'}時間
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* 配分結果と同じ時給単価を表示 */}
                      {entry.hourly_rate ? formatCurrency(entry.hourly_rate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* 配分結果と同じ一般管理費を計算して表示 */}
                      {(() => {
                        // 配分結果と同じ計算ロジックを使用
                        const totalWorkHoursFromDB = entry.total_work_hours || 0 // DBに保存された総工数（プロジェクト工数+一般管理費工数）
                        const totalSalary = entry.salary_amount || 0
                        
                        // 配分結果の固定値を使用
                        const overheadHoursFixed = 1.2 // 一般管理費工数（固定）
                        const projectHoursCalculated = totalWorkHoursFromDB - overheadHoursFixed // プロジェクト工数 = 総工数 - 一般管理費工数
                        
                        // 配分結果と同じ時給単価を計算
                        const hourlyRate = totalWorkHoursFromDB > 0 ? totalSalary / totalWorkHoursFromDB : 0
                        
                        // 一般管理費を計算
                        const overheadLaborCost = overheadHoursFixed * hourlyRate
                        
                        return formatCurrency(overheadLaborCost)
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          disabled={editingEntry}
                          className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          disabled={deletingEntry || editingEntry}
                          className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deletingEntry?.id === entry.id ? '削除中...' : '削除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">給与入力の流れ：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>社員名、給与総額、期間を入力してください</li>
              <li>「プロジェクト配分を計算」をクリックすると、指定期間の作業日報データから各プロジェクトの工数を取得します</li>
              <li>給与総額を総工数（一般管理費含む）で割って時給単価を計算し、各プロジェクトと一般管理費の人件費を算出します</li>
              <li>「原価入力に保存」をクリックすると、各プロジェクトの人件費が原価データとして保存されます（一般管理費は別途管理）</li>
            </ol>
            <p className="mt-2 text-xs">
              ※ 作業日報データが存在しない場合、計算できません。事前に作業日報の入力をお願いします。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
