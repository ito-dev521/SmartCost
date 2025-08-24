'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables, SalaryEntry, SalaryAllocation } from '@/lib/supabase'
import { Plus, Save, Calculator, Users, AlertCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react'

type Project = Tables<'projects'>
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

interface SalaryEntryFormProps {
  initialProjects: Project[]
  initialCategories: BudgetCategory[]
}

export default function SalaryEntryForm({
  initialProjects,
  initialCategories
}: SalaryEntryFormProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  })

  // 給与入力フォームデータ
  const [salaryForm, setSalaryForm] = useState({
    employee_name: '',
    employee_department: '',
    salary_amount: 0,
    salary_period_start: new Date().toISOString().slice(0, 10),
    salary_period_end: new Date().toISOString().slice(0, 10),
    notes: ''
  })

  // プロジェクト配分
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([])
  const [laborCosts, setLaborCosts] = useState<any[]>([])

  const supabase = createClientComponentClient()

  // 工数データを取得してプロジェクト配分を計算
  const calculateProjectAllocations = async () => {
    if (!salaryForm.employee_name || !selectedPeriod.start || !selectedPeriod.end) {
      alert('社員名と期間を選択してください')
      return
    }

    setCalculating(true)
    try {
      // 指定期間の作業日報データを取得
      const { data: dailyReports, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          projects:project_id(name, business_number),
          users:user_id(name, email)
        `)
        .gte('date', selectedPeriod.start)
        .lte('date', selectedPeriod.end)

      if (error) throw error

      // プロジェクト毎の工数集計
      const projectHours: { [key: string]: { project: any, totalHours: number } } = {}

      dailyReports?.forEach(report => {
        const projectKey = report.project_id
        if (!projectHours[projectKey]) {
          projectHours[projectKey] = {
            project: report.projects,
            totalHours: 0
          }
        }
        projectHours[projectKey].totalHours += report.work_hours || 0
      })

      // 総工数を計算
      const totalHours = Object.values(projectHours).reduce((sum, item) => sum + item.totalHours, 0)

      if (totalHours === 0) {
        alert('指定期間に作業日報データがありません')
        return
      }

      // 時給単価を計算（給与総額 ÷ 総工数）
      const hourlyRate = salaryForm.salary_amount / totalHours

      // プロジェクト毎の人件費を計算
      const allocations: ProjectAllocation[] = Object.entries(projectHours).map(([projectId, data]) => ({
        project_id: projectId,
        work_hours: data.totalHours,
        hourly_rate: hourlyRate,
        labor_cost: data.totalHours * hourlyRate
      }))

      setProjectAllocations(allocations)

      // プロジェクト毎の人件費データを生成
      const costs = allocations.map(allocation => {
        const project = projects.find(p => p.id === allocation.project_id)
        return {
          project_id: allocation.project_id,
          project_name: project?.name || '不明',
          business_number: project?.business_number || '',
          work_hours: allocation.work_hours,
          hourly_rate: allocation.hourly_rate,
          labor_cost: allocation.labor_cost,
          category_id: categories.find(cat => cat.name.includes('人件費'))?.id || ''
        }
      })

      setLaborCosts(costs)

    } catch (error) {
      console.error('プロジェクト配分計算エラー:', error)
      alert('プロジェクト配分の計算に失敗しました')
    } finally {
      setCalculating(false)
    }
  }

  // 給与データを保存
  const saveSalaryData = async () => {
    if (laborCosts.length === 0) {
      alert('まずプロジェクト配分を計算してください')
      return
    }

    setSaving(true)
    try {
      const currentUserId = await getCurrentUserId()

      // 1. 給与エントリーを保存
      const salaryEntryData = {
        employee_name: salaryForm.employee_name,
        employee_department: salaryForm.employee_department || null,
        salary_amount: salaryForm.salary_amount,
        salary_period_start: selectedPeriod.start,
        salary_period_end: selectedPeriod.end,
        total_work_hours: laborCosts.reduce((sum, cost) => sum + cost.work_hours, 0),
        hourly_rate: salaryForm.salary_amount / laborCosts.reduce((sum, cost) => sum + cost.work_hours, 0),
        notes: salaryForm.notes || null,
        created_by: currentUserId
      }

      const { data: salaryEntry, error: salaryError } = await supabase
        .from('salary_entries')
        .insert([salaryEntryData])
        .select()
        .single()

      if (salaryError) throw salaryError

      // 2. 給与配分を保存
      const salaryAllocations = laborCosts.map(cost => ({
        salary_entry_id: salaryEntry.id,
        project_id: cost.project_id,
        work_hours: cost.work_hours,
        hourly_rate: cost.hourly_rate,
        labor_cost: cost.labor_cost
      }))

      const { error: allocationError } = await supabase
        .from('salary_allocations')
        .insert(salaryAllocations)

      if (allocationError) throw allocationError

      // 3. プロジェクト原価としてcost_entriesにも保存
      const costEntries = laborCosts.map(cost => ({
        project_id: cost.project_id,
        category_id: cost.category_id,
        entry_date: selectedPeriod.end, // 期間の終了日を原価発生日とする
        amount: cost.labor_cost,
        description: `${salaryForm.employee_name}の人件費（${selectedPeriod.start}～${selectedPeriod.end}）`,
        entry_type: 'direct',
        created_by: currentUserId
      }))

      const { error: costError } = await supabase
        .from('cost_entries')
        .insert(costEntries)

      if (costError) throw costError

      alert('給与データとプロジェクト人件費データを保存しました')

      // フォームをリセット
      setProjectAllocations([])
      setLaborCosts([])
      setSalaryForm({
        employee_name: '',
        employee_department: '',
        salary_amount: 0,
        salary_period_start: new Date().toISOString().slice(0, 10),
        salary_period_end: new Date().toISOString().slice(0, 10),
        notes: ''
      })

    } catch (error) {
      console.error('保存エラー:', error)
      alert('データの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 現在のユーザーIDを取得
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'unknown'
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

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">給与入力</h1>
        <p className="mt-1 text-sm text-gray-500">
          給与を入力して作業日報の工数に基づきプロジェクト毎の人件費を計算・保存します
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 給与入力フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">給与情報入力</h2>
          </div>

          <form className="space-y-6">
            {/* 社員情報 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                  社員名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="employee_name"
                  value={salaryForm.employee_name}
                  onChange={(e) => setSalaryForm({...salaryForm, employee_name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：山田太郎"
                />
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
                  placeholder="例：技術部"
                />
              </div>
            </div>

            {/* 給与額 */}
            <div>
              <label htmlFor="salary_amount" className="block text-sm font-medium text-gray-700">
                給与総額（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="salary_amount"
                min="0"
                step="1"
                value={salaryForm.salary_amount}
                onChange={(e) => setSalaryForm({...salaryForm, salary_amount: parseInt(e.target.value) || 0})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000000"
              />
            </div>

            {/* 期間設定 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="period_start" className="block text-sm font-medium text-gray-700">
                  期間開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="period_start"
                  value={selectedPeriod.start}
                  onChange={(e) => setSelectedPeriod({...selectedPeriod, start: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="period_end" className="block text-sm font-medium text-gray-700">
                  期間終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="period_end"
                  value={selectedPeriod.end}
                  onChange={(e) => setSelectedPeriod({...selectedPeriod, end: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
            <h2 className="text-lg font-medium text-gray-900">プロジェクト配分結果</h2>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-sm text-blue-600">総工数</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {totalWorkHours.toFixed(1)}時間
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">時給単価</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(salaryForm.salary_amount / totalWorkHours)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">総人件費</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(totalLaborCost)}
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
                          {cost.business_number} - {cost.project_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          工数: {cost.work_hours.toFixed(1)}時間 × 時給: {formatCurrency(cost.hourly_rate)}
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
                  {saving ? '保存中...' : '給与データを保存'}
                </button>
              </div>
            </div>
          )}
        </div>
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
              <li>給与総額を総工数で割って時給単価を計算し、各プロジェクトの人件費を算出します</li>
              <li>「原価入力に保存」をクリックすると、各プロジェクトの人件費が原価データとして保存されます</li>
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
