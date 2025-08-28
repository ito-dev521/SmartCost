'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  Building,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Project {
  id: string
  name: string
  business_number: string
  status: string
  contract_amount: number | null
  start_date: string | null
  end_date: string | null
  client_name: string | null
}

interface CostEntry {
  id: string
  project_id: string | null
  category_id: string
  company_name: string | null
  entry_date: string
  amount: number
  description: string | null
  entry_type: string
  created_at: string
}

interface BudgetCategory {
  id: string
  name: string
  level: number
  parent_id: string | null
}

interface Client {
  id: string
  name: string
  payment_cycle_type: string | null
  payment_cycle_closing_day: number | null
  payment_cycle_payment_month_offset: number | null
  payment_cycle_payment_day: number | null
  payment_cycle_description: string | null
}

interface CaddonBilling {
  id: string
  project_id: string
  client_id: string
  billing_month: string
  caddon_usage_fee: number
  initial_setup_fee: number
  support_fee: number
  total_amount: number
  billing_status: string
}

interface MonthlyRevenue {
  projectId: string
  projectName: string
  clientName: string
  businessNumber: string
  startDate: string | null
  endDate: string | null
  contractAmount: number | null
  monthlyAmounts: { [month: string]: number }
  totalRevenue: number
  isSplitBilling: boolean
  splitBillingAmounts: { [month: string]: number }
}

interface FiscalInfo {
  id: string
  fiscal_year: number
  settlement_month: number
  current_period: number
  bank_balance: number
  notes: string
}

export default function AnalyticsDashboard() {
  // PDF印刷用のスタイル
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        @page {
          size: A3 landscape;
          margin: 15mm;
        }
        
        body {
          font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
          font-size: 8px;
          margin: 0;
          padding: 0;
        }
        
        .no-print {
          display: none !important;
        }
        
        /* 年間入金予定表の印刷最適化 */
        .annual-revenue-table {
          table-layout: fixed;
          width: 100%;
          border-collapse: collapse;
          page-break-inside: auto;
        }
        
        .annual-revenue-table th,
        .annual-revenue-table td {
          padding: 2px 4px;
          font-size: 8px;
          border: 1px solid #ddd;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* 列幅設定 */
        .annual-revenue-table th:nth-child(1), /* 業務番号 */
        .annual-revenue-table td:nth-child(1) {
          width: 60px;
          min-width: 60px;
        }
        
        .annual-revenue-table th:nth-child(2), /* プロジェクト名 */
        .annual-revenue-table td:nth-child(2) {
          width: 120px;
          min-width: 120px;
        }
        
        .annual-revenue-table th:nth-child(3), /* クライアント名 */
        .annual-revenue-table td:nth-child(3) {
          width: 80px;
          min-width: 80px;
        }
        
        .annual-revenue-table th:nth-child(4), /* 開始日 */
        .annual-revenue-table td:nth-child(4),
        .annual-revenue-table th:nth-child(5), /* 終了日 */
        .annual-revenue-table td:nth-child(5) {
          width: 50px;
          min-width: 50px;
        }
        
        .annual-revenue-table th:nth-child(6), /* 契約金額 */
        .annual-revenue-table td:nth-child(6) {
          width: 70px;
          min-width: 70px;
          text-align: right;
        }
        
        /* 月次列（7-18列目） */
        .annual-revenue-table th:nth-child(n+7):nth-child(-n+18),
        .annual-revenue-table td:nth-child(n+7):nth-child(-n+18) {
          width: 45px;
          min-width: 45px;
          text-align: right;
        }
        
        .annual-revenue-table th:nth-child(19), /* 年間合計 */
        .annual-revenue-table td:nth-child(19) {
          width: 70px;
          min-width: 70px;
          text-align: right;
        }
        
        .annual-revenue-table th:nth-child(20), /* 操作 */
        .annual-revenue-table td:nth-child(20) {
          width: 60px;
          min-width: 60px;
        }
        
        /* ヘッダー固定 */
        .annual-revenue-table thead {
          page-break-after: avoid;
        }
        
        /* 合計行の強調 */
        .annual-revenue-table tr:last-child {
          background-color: #f3f4f6 !important;
          font-weight: bold;
        }
        
        /* 金額列の右寄せ */
        .annual-revenue-table td[data-amount="true"] {
          text-align: right;
        }
        
        /* 印刷時のページ分割 */
        .annual-revenue-table tr {
          page-break-inside: avoid;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])
  const [projects, setProjects] = useState<Project[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState('month')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'total-performance', 'annual-revenue']))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [clients, setClients] = useState<Client[]>([])
  const [caddonBillings, setCaddonBillings] = useState<CaddonBilling[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null)
  const [editingSplitBilling, setEditingSplitBilling] = useState<string | null>(null)
  const [editingMonth, setEditingMonth] = useState<{projectId: string, month: string} | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: string}>({})

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  // プロジェクト、クライアント、決算情報が取得された後に月次収益を計算
  useEffect(() => {
    if (projects.length > 0 && fiscalInfo) {
      console.log('データが揃ったため月次収益を計算します:', {
        projects: projects.length,
        clients: clients.length,
        fiscalInfo
      })
      calculateMonthlyRevenue()
    }
  }, [projects, clients, fiscalInfo])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // プロジェクトデータを取得
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      // 原価エントリーデータを取得
      const { data: costEntriesData } = await supabase
        .from('cost_entries')
        .select('*')
        .order('entry_date', { ascending: false })

      // 予算科目データを取得
      const { data: categoriesData } = await supabase
        .from('budget_categories')
        .select('*')
        .order('level, sort_order')

      // クライアントデータを取得
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      // CADDON請求データを取得
      const { data: caddonBillingsData } = await supabase
        .from('caddon_billing')
        .select('*')
        .order('billing_month')

      // 決算情報を取得
      const { data: fiscalInfoData } = await supabase
        .from('fiscal_info')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .limit(1)

      // 決算情報を設定
      if (fiscalInfoData && fiscalInfoData.length > 0) {
        setFiscalInfo(fiscalInfoData[0])
      } else {
        console.log('決算情報が取得できません。デフォルト値（3月決算）を使用します。')
        const defaultFiscalInfo: FiscalInfo = {
          id: 'default',
          fiscal_year: new Date().getFullYear(),
          settlement_month: 3,
          current_period: 1,
          bank_balance: 0,
          notes: 'デフォルト設定'
        }
        setFiscalInfo(defaultFiscalInfo)
      }

      console.log('データ取得結果:', {
        projects: projectsData?.length || 0,
        costEntries: costEntriesData?.length || 0,
        categories: categoriesData?.length || 0,
        clients: clientsData?.length || 0,
        caddonBillings: caddonBillingsData?.length || 0,
        fiscalInfo: fiscalInfoData?.length || 0
      })

      if (projectsData) setProjects(projectsData)
      if (costEntriesData) setCostEntries(costEntriesData)
      if (categoriesData) setCategories(categoriesData)
      if (clientsData) setClients(clientsData)
      if (caddonBillingsData) setCaddonBillings(caddonBillingsData)
      if (fiscalInfoData && fiscalInfoData.length > 0) setFiscalInfo(fiscalInfoData[0])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされたデータを取得
  const getFilteredData = () => {
    let filtered = costEntries

    // 日付範囲でフィルタリング
    if (selectedDateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (selectedDateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(entry => new Date(entry.entry_date) >= startDate)
    }

    // プロジェクトでフィルタリング
    if (selectedProject !== 'all') {
      filtered = filtered.filter(entry => entry.project_id === selectedProject)
    }

    // カテゴリでフィルタリング
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category_id === selectedCategory)
    }

    return filtered
  }

  // 統計データを計算
  const calculateStats = () => {
    const filteredData = getFilteredData()

    const totalCost = filteredData.reduce((sum, entry) => sum + entry.amount, 0)
    const projectCosts = filteredData.filter(entry => entry.project_id)
    const generalCosts = filteredData.filter(entry => !entry.project_id)

    const projectCostTotal = projectCosts.reduce((sum, entry) => sum + entry.amount, 0)
    const generalCostTotal = generalCosts.reduce((sum, entry) => sum + entry.amount, 0)

    // 契約金額合計を計算
    const totalContractAmount = projects
      .filter(project => project.contract_amount)
      .reduce((sum, project) => sum + (project.contract_amount || 0), 0)

    // 総利益を計算（契約金額 - プロジェクト原価）
    const totalProfit = totalContractAmount - projectCostTotal
    const totalProfitMargin = totalContractAmount > 0 ? (totalProfit / totalContractAmount) * 100 : 0

    return {
      totalCost,
      projectCostTotal,
      generalCostTotal,
      totalContractAmount,
      totalProfit,
      totalProfitMargin,
      entryCount: filteredData.length,
      projectCount: new Set(projectCosts.map(entry => entry.project_id)).size
    }
  }

  // プロジェクト別原価集計
  const getProjectCostBreakdown = () => {
    const filteredData = getFilteredData().filter(entry => entry.project_id)

    const breakdown = projects.map(project => {
      const projectCosts = filteredData.filter(entry => entry.project_id === project.id)
      const total = projectCosts.reduce((sum, entry) => sum + entry.amount, 0)

      // 契約金額との比較
      const contractAmount = project.contract_amount || 0
      const profit = contractAmount - total
      const profitMargin = contractAmount > 0 ? (profit / contractAmount) * 100 : 0

      return {
        project,
        total,
        count: projectCosts.length,
        costs: projectCosts,
        contractAmount,
        profit,
        profitMargin
      }
    }).filter(item => item.total > 0 || item.contractAmount > 0)

    return breakdown.sort((a, b) => {
      // 契約金額がある場合は利益率でソート、ない場合は原価でソート
      if (a.contractAmount > 0 && b.contractAmount > 0) {
        return b.profitMargin - a.profitMargin
      } else if (a.contractAmount > 0) {
        return -1
      } else if (b.contractAmount > 0) {
        return 1
      } else {
        return b.total - a.total
      }
    })
  }

  // カテゴリ別原価集計
  const getCategoryCostBreakdown = () => {
    const filteredData = getFilteredData()
    
    const breakdown = categories.map(category => {
      const categoryCosts = filteredData.filter(entry => entry.category_id === category.id)
      const total = categoryCosts.reduce((sum, entry) => sum + entry.amount, 0)
      
      return {
        category,
        total,
        count: categoryCosts.length
      }
    }).filter(item => item.total > 0)
    
    return breakdown.sort((a, b) => b.total - a.total)
  }

  // 入金予定日を計算
  const calculatePaymentDate = (endDate: string, client: Client): Date => {
    if (process.env.NODE_ENV === 'development') {
      console.log('calculatePaymentDate開始:', {
        endDate,
        clientName: client.name,
        payment_cycle_type: client.payment_cycle_type,
        payment_cycle_closing_day: client.payment_cycle_closing_day,
        payment_cycle_payment_month_offset: client.payment_cycle_payment_month_offset,
        payment_cycle_payment_day: client.payment_cycle_payment_day
      })
    }

    if (!endDate || !client.payment_cycle_type) {
      if (process.env.NODE_ENV === 'development') {
        console.log('デフォルト計算（入金サイクルなし）')
      }
      return new Date(endDate || new Date())
    }

    const end = new Date(endDate)
    let paymentDate = new Date()

    if (client.payment_cycle_type === 'month_end') {
      // 月末締め翌月末払いの場合
      if (process.env.NODE_ENV === 'development') {
        console.log('月末締め翌月末払い計算')
      }
      // 完了月の翌月末を入金予定日とする
      const targetYear = end.getMonth() === 11 ? end.getFullYear() + 1 : end.getFullYear()
      const targetMonth = end.getMonth() === 11 ? 0 : end.getMonth() + 1
      
      if (process.env.NODE_ENV === 'development') {
        console.log('計算過程:', {
          endMonth: end.getMonth(),
          endYear: end.getFullYear(),
          targetYear,
          targetMonth,
          isDecember: end.getMonth() === 11
        })
      }
      
      paymentDate.setFullYear(targetYear)
      paymentDate.setMonth(targetMonth)
      paymentDate.setDate(new Date(targetYear, targetMonth + 1, 0).getDate()) // その月の末日
      
      if (process.env.NODE_ENV === 'development') {
        console.log('設定後の日付:', {
          year: paymentDate.getFullYear(),
          month: paymentDate.getMonth(),
          date: paymentDate.getDate(),
          fullDate: paymentDate.toISOString()
        })
      }
    } else if (client.payment_cycle_type === 'specific_date') {
              // 特定日締めの場合
        const closingDay = client.payment_cycle_closing_day || 25
        const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
        const paymentDay = client.payment_cycle_payment_day || 15

        if (process.env.NODE_ENV === 'development') {
          console.log('特定日締め計算:', {
            closingDay,
            paymentMonthOffset,
            paymentDay,
            endDay: end.getDate(),
            isBeforeClosing: end.getDate() <= closingDay
          })
        }

      if (end.getDate() <= closingDay) {
        // 締め日以前の場合は当月締め
        paymentDate.setFullYear(end.getFullYear())
        paymentDate.setMonth(end.getMonth() + paymentMonthOffset)
        paymentDate.setDate(paymentDay)
      } else {
        // 締め日以降の場合は翌月締め
        paymentDate.setFullYear(end.getFullYear())
        paymentDate.setMonth(end.getMonth() + paymentMonthOffset + 1)
        paymentDate.setDate(paymentDay)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('計算結果:', {
        originalDate: end.toISOString(),
        calculatedDate: paymentDate.toISOString()
      })
    }

    return paymentDate
  }

  // 月次収益を計算
  const calculateMonthlyRevenue = useCallback(() => {
    console.log('calculateMonthlyRevenue開始:', {
      fiscalInfo,
      projectsCount: projects.length,
      clientsCount: clients.length,
      caddonBillingsCount: caddonBillings.length
    })

    // 決算情報がない場合はデフォルト値を使用
    const currentFiscalInfo = fiscalInfo || {
      id: 'default',
      fiscal_year: new Date().getFullYear(),
      settlement_month: 3,
      current_period: 1,
      bank_balance: 0,
      notes: 'デフォルト設定'
    }

    const fiscalYearStart = currentFiscalInfo.settlement_month + 1
    console.log('年度開始月:', fiscalYearStart)
    const monthlyData: MonthlyRevenue[] = []

    // 一般管理費を除外したプロジェクトを取得
    const filteredProjects = projects.filter(project => 
      !project.name.includes('一般管理費') && 
      !project.name.includes('その他経費')
    )
    
    console.log('フィルタリング後のプロジェクト:', {
      total: projects.length,
      filtered: filteredProjects.length,
      projects: filteredProjects.map(p => ({ id: p.id, name: p.name, client: p.client_name }))
    })

    filteredProjects.forEach(project => {
      const client = clients.find(c => c.name === project.client_name)
      const monthlyAmounts: { [month: string]: number } = {}
      let totalRevenue = 0

      if (process.env.NODE_ENV === 'development') {
        console.log('プロジェクト処理:', {
          businessNumber: project.business_number,
          projectName: project.name,
          clientName: project.client_name,
          clientFound: !!client,
          endDate: project.end_date,
          clientData: client ? {
            payment_cycle_type: client.payment_cycle_type,
            payment_cycle_closing_day: client.payment_cycle_closing_day,
            payment_cycle_payment_month_offset: client.payment_cycle_payment_month_offset,
            payment_cycle_payment_day: client.payment_cycle_payment_day
          } : null
        })
      }

      if (project.name.includes('CADDON')) {
        // CADDONプロジェクトの場合
        const projectBillings = caddonBillings.filter(billing => billing.project_id === project.id)
        projectBillings.forEach(billing => {
          const month = billing.billing_month
          monthlyAmounts[month] = (monthlyAmounts[month] || 0) + billing.total_amount
          totalRevenue += billing.total_amount
        })
      } else {
        // 通常プロジェクトの場合
        if (project.end_date && project.contract_amount && client) {
          const paymentDate = calculatePaymentDate(project.end_date, client)
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          
          if (process.env.NODE_ENV === 'development') {
            console.log('入金予定日計算:', {
              projectName: project.name,
              endDate: project.end_date,
              paymentDate: paymentDate.toISOString(),
              monthKey,
              contractAmount: project.contract_amount
            })
          }
          
          monthlyAmounts[monthKey] = project.contract_amount
          totalRevenue = project.contract_amount
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('プロジェクトスキップ:', {
              projectName: project.name,
              endDate: project.end_date,
              contractAmount: project.contract_amount,
              hasClient: !!client
            })
          }
        }
      }

      monthlyData.push({
        projectId: project.id,
        projectName: project.name,
        clientName: project.name.includes('CADDON') ? '-' : (project.client_name || ''),
        businessNumber: project.business_number,
        startDate: project.start_date,
        endDate: project.end_date,
        contractAmount: project.contract_amount,
        monthlyAmounts,
        totalRevenue,
        isSplitBilling: false,
        splitBillingAmounts: {}
      })
    })

    console.log('生成された月次データ:', monthlyData)
    setMonthlyRevenue(monthlyData)
  }, [fiscalInfo, projects, clients, caddonBillings, selectedYear])

  // 年間合計を計算
  const calculateYearlyTotal = (item: MonthlyRevenue) => {
    const fiscalYearStart = (fiscalInfo?.settlement_month || 3) + 1
    let yearlyTotal = 0
    for (let i = 0; i < 12; i++) {
      const month = (fiscalYearStart + i) % 12 + 1
      const year = month <= fiscalYearStart ? selectedYear + 1 : selectedYear
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
      yearlyTotal += amount
    }
    return yearlyTotal
  }

  // 月次編集を開始
  const startMonthEdit = (projectId: string, month: string) => {
    // 現在の値を取得して編集値として設定
    const currentItem = monthlyRevenue.find(item => item.projectId === projectId)
    const currentAmount = currentItem ? (currentItem.splitBillingAmounts[month] || currentItem.monthlyAmounts[month] || 0) : 0
    
    setEditValues(prev => ({
      ...prev,
      [`${projectId}-${month}`]: currentAmount.toLocaleString('ja-JP')
    }))
    setEditingMonth({ projectId, month })
  }

  // 月次編集を保存
  const saveMonthEdit = (projectId: string, month: string, amount: number) => {
    console.log('saveMonthEdit呼び出し:', { projectId, month, amount })
    
    setMonthlyRevenue(prev => {
      console.log('更新前のmonthlyRevenue:', prev)
      
      const updated = prev.map(item => {
        if (item.projectId === projectId) {
          const newSplitBillingAmounts = { ...item.splitBillingAmounts }
          newSplitBillingAmounts[month] = amount
          
          // 合計を再計算
          const total = Object.values(newSplitBillingAmounts).reduce((sum, val) => sum + val, 0)
          
          console.log('更新されるアイテム:', {
            projectId: item.projectId,
            month,
            amount,
            newSplitBillingAmounts,
            total
          })
          
          return {
            ...item,
            splitBillingAmounts: newSplitBillingAmounts,
            isSplitBilling: true,
            totalRevenue: total
          }
        }
        return item
      })
      
      console.log('更新後のmonthlyRevenue:', updated)
      return updated
    })
    
    setEditingMonth(null)
    // 編集値をクリア
    setEditValues(prev => {
      const newValues = { ...prev }
      delete newValues[`${projectId}-${month}`]
      return newValues
    })
  }

  // 月次編集をキャンセル
  const cancelMonthEdit = () => {
    setEditingMonth(null)
    // 編集値をクリア
    setEditValues(prev => {
      const newValues = { ...prev }
      delete newValues[`${editingMonth?.projectId}-${editingMonth?.month}`]
      return newValues
    })
  }

  // CSVエクスポート
  const exportToCSV = () => {
    if (!monthlyRevenue.length) return

    const fiscalYearStart = fiscalInfo ? fiscalInfo.settlement_month + 1 : 4
    const months: string[] = []
    for (let i = 0; i < 12; i++) {
      const month = (fiscalYearStart + i) % 12 + 1
      const year = month <= fiscalYearStart ? selectedYear + 1 : selectedYear
      months.push(`${year}-${String(month).padStart(2, '0')}`)
    }

    const headers = ['業務番号', 'プロジェクト名', 'クライアント名', '開始日', '終了日', '契約金額', ...months, '年間合計']
    const csvData = monthlyRevenue.map(item => {
      const row = [
        item.businessNumber,
        item.projectName,
        item.clientName,
        item.startDate || '',
        item.endDate || '',
        item.contractAmount || 0
      ]
      
      months.forEach(month => {
        const amount = item.splitBillingAmounts[month] || item.monthlyAmounts[month] || 0
        row.push(amount)
      })
      
      row.push(calculateYearlyTotal(item))
      return row
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `年間入金予定表_${selectedYear}年度.csv`
    link.click()
  }

  // PDFエクスポート
  const exportToPDF = () => {
    window.print()
  }

  // 月別原価推移
  const getMonthlyCostTrend = () => {
    const filteredData = getFilteredData()
    
    const monthlyData: { [key: string]: number } = {}
    
    filteredData.forEach(entry => {
      const month = entry.entry_date.substring(0, 7) // YYYY-MM形式
      monthlyData[month] = (monthlyData[month] || 0) + entry.amount
    })
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }))
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = calculateStats()
  const projectBreakdown = getProjectCostBreakdown()
  const categoryBreakdown = getCategoryCostBreakdown()
  const monthlyTrend = getMonthlyCostTrend()

  return (
    <div className="space-y-6">
      {/* フィルターセクション */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">フィルター設定</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 日付範囲 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日付範囲
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全期間</option>
              <option value="week">過去1週間</option>
              <option value="month">過去1ヶ月</option>
              <option value="quarter">過去3ヶ月</option>
              <option value="year">過去1年</option>
            </select>
          </div>

          {/* プロジェクト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全プロジェクト</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.business_number} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原価科目
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全科目</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* リセットボタン */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedDateRange('all')
                setSelectedProject('all')
                setSelectedCategory('all')
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              フィルターリセット
            </button>
          </div>
        </div>
      </div>

      {/* 概要統計 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <h3 className="text-lg font-semibold">概要統計</h3>
          {expandedSections.has('overview') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('overview') && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCost)}</div>
              <div className="text-sm text-gray-600">総原価</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.projectCostTotal)}</div>
              <div className="text-sm text-gray-600">プロジェクト原価</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.generalCostTotal)}</div>
              <div className="text-sm text-gray-600">その他経費</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalContractAmount)}</div>
              <div className="text-sm text-gray-600">総契約金額</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.totalProfit)}</div>
              <div className="text-sm text-gray-600">総利益</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{stats.totalProfitMargin.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">平均利益率</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{stats.entryCount}</div>
              <div className="text-sm text-gray-600">エントリ数</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{stats.projectCount}</div>
              <div className="text-sm text-gray-600">対象プロジェクト数</div>
            </div>
          </div>
        )}
      </div>

      {/* プロジェクト別原価分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('project-analysis')}
        >
          <h3 className="text-lg font-semibold">プロジェクト別収益性分析</h3>
          {expandedSections.has('project-analysis') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('project-analysis') && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロジェクト
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業務番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      契約金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      原価合計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利益
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利益率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      エントリ数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBreakdown.map((item) => (
                    <tr key={item.project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.project.name}
                        {item.project.client_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.project.client_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.project.business_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          item.project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                          item.project.status === 'on_hold' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.project.status === 'completed' ? '完了' :
                           item.project.status === 'in_progress' ? '進行中' :
                           item.project.status === 'planning' ? '計画中' :
                           item.project.status === 'on_hold' ? '保留中' : '中止'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? formatCurrency(item.contractAmount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? (
                          <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.profit)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.contractAmount > 0 ? (
                          <span className={item.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* カテゴリ別原価分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('category-analysis')}
        >
          <h3 className="text-lg font-semibold">カテゴリ別原価分析</h3>
          {expandedSections.has('category-analysis') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('category-analysis') && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* テーブル表示 */}
              <div>
                <h4 className="text-md font-medium mb-3">詳細一覧</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          カテゴリ
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          件数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryBreakdown.map((item) => (
                        <tr key={item.category.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.category.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 円グラフ表示（プレースホルダー） */}
              <div>
                <h4 className="text-md font-medium mb-3">構成比</h4>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">円グラフ実装予定</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 年間入金予定表 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('annual-revenue')}
        >
          <h3 className="text-lg font-semibold">年間入金予定表</h3>
          {expandedSections.has('annual-revenue') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        {expandedSections.has('annual-revenue') && (
          <div className="mt-4">
            {/* 年度選択とエクスポートボタン */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">年度:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}年度</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 no-print">
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* 年間入金予定表 */}
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">プロジェクトデータがありません</p>
                <p className="text-sm text-gray-400 mb-4">
                  プロジェクト管理画面でプロジェクトを作成してください。
                </p>
                <button
                  onClick={() => fetchData()}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  データを再取得
                </button>
              </div>
            ) : monthlyRevenue.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">月次収益データを計算中...</p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• プロジェクトデータ: {projects.length}件</p>
                  <p>• クライアントデータ: {clients.length}件</p>
                  <p>• CADDON請求データ: {caddonBillings.length}件</p>
                  <p>• 決算情報: {fiscalInfo ? '設定済み' : '未設定'}</p>
                </div>
                <button
                  onClick={() => fetchData()}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  データを再取得
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 annual-revenue-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                      業務番号
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      プロジェクト名
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      クライアント名
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">
                      開始日
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">
                      終了日
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                      契約金額
                    </th>
                    {fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                      const month = (fiscalInfo.settlement_month + 1 + i) % 12 + 1
                      const year = month <= fiscalInfo.settlement_month + 1 ? selectedYear + 1 : selectedYear
                      return (
                        <th key={month} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[45px]">
                          {month}月
                        </th>
                      )
                    })}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                      年間合計
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyRevenue.map((item) => (
                    <tr key={item.projectId} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.businessNumber}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-blue-600">
                        {item.projectName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.clientName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString('ja-JP') : ''}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.endDate ? new Date(item.endDate).toLocaleDateString('ja-JP') : ''}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-600" data-amount="true">
                        {item.contractAmount ? formatCurrency(item.contractAmount) : ''}
                      </td>
                      {fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                        const month = (fiscalInfo.settlement_month + 1 + i) % 12 + 1
                        const year = month <= fiscalInfo.settlement_month + 1 ? selectedYear + 1 : selectedYear
                        const monthKey = `${year}-${String(month).padStart(2, '0')}`
                        const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
                        
                        return (
                          <td key={month} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900" data-amount="true">
                            {editingMonth?.projectId === item.projectId && editingMonth?.month === monthKey ? (
                              <div className="flex items-center space-x-1 no-print">
                                <input
                                  type="text"
                                  value={editValues[`${item.projectId}-${monthKey}`] || ''}
                                  data-month={monthKey}
                                  data-project={item.projectId}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = e.currentTarget.value.replace(/[,\s]/g, '')
                                      saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                    } else if (e.key === 'Escape') {
                                      cancelMonthEdit()
                                    }
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, '')
                                    const numValue = value ? parseInt(value, 10) : 0
                                    setEditValues(prev => ({
                                      ...prev,
                                      [`${item.projectId}-${monthKey}`]: numValue.toLocaleString('ja-JP')
                                    }))
                                  }}
                                  onBlur={() => {
                                    const value = editValues[`${item.projectId}-${monthKey}`]?.replace(/[,\s]/g, '') || '0'
                                    saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const value = editValues[`${item.projectId}-${monthKey}`]?.replace(/[,\s]/g, '') || '0'
                                    saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelMonthEdit}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:text-blue-600"
                                onClick={() => startMonthEdit(item.projectId, monthKey)}
                                title="分割請求を開始"
                              >
                                {amount > 0 ? formatCurrency(amount) : '-'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900" data-amount="true">
                        <span className={calculateYearlyTotal(item) !== (item.contractAmount || 0) ? 'text-red-600' : ''}>
                          {formatCurrency(calculateYearlyTotal(item))}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        -
                      </td>
                    </tr>
                  ))}
                  {/* 合計行 */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="sticky left-0 bg-gray-100 px-3 py-2 text-sm text-gray-900">合計</td>
                    <td className="px-3 py-2 text-sm text-gray-900" colSpan={4}></td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatCurrency(monthlyRevenue.reduce((sum, item) => sum + (item.contractAmount || 0), 0))}
                    </td>
                    {fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                      const month = (fiscalInfo.settlement_month + 1 + i) % 12 + 1
                      const year = month <= fiscalInfo.settlement_month + 1 ? selectedYear + 1 : selectedYear
                      const monthKey = `${year}-${String(month).padStart(2, '0')}`
                      const total = monthlyRevenue.reduce((sum, item) => {
                        const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
                        return sum + amount
                      }, 0)
                      
                                              return (
                          <td key={month} className="px-3 py-2 text-sm text-gray-900" data-amount="true">
                            {formatCurrency(total)}
                          </td>
                        )
                    })}
                    <td className="px-3 py-2 text-sm text-gray-900" data-amount="true">
                      {formatCurrency(monthlyRevenue.reduce((sum, item) => sum + item.totalRevenue, 0))}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}
      </div>

      {/* 総合成績分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('total-performance')}
        >
          <h3 className="text-lg font-semibold">総合成績分析</h3>
          {expandedSections.has('total-performance') ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {expandedSections.has('total-performance') && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 総合成績サマリー */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">総合成績サマリー</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総契約金額:</span>
                    <span className="text-sm font-medium text-blue-900">{formatCurrency(stats.totalContractAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総原価:</span>
                    <span className="text-sm font-medium text-blue-900">{formatCurrency(stats.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">総利益:</span>
                    <span className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">平均利益率:</span>
                    <span className={`text-sm font-medium ${stats.totalProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 原価構成比 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4">原価構成比</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">プロジェクト原価:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.totalCost > 0 ? ((stats.projectCostTotal / stats.totalCost) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">その他経費:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.totalCost > 0 ? ((stats.generalCostTotal / stats.totalCost) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">プロジェクト数:</span>
                    <span className="text-sm font-medium text-green-900">{stats.projectCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">平均原価/プロジェクト:</span>
                    <span className="text-sm font-medium text-green-900">
                      {stats.projectCount > 0 ? formatCurrency(stats.projectCostTotal / stats.projectCount) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 収益性指標 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">収益性指標</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">粗利益:</span>
                    <span className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">粗利益率:</span>
                    <span className={`text-sm font-medium ${stats.totalProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">契約金額対原価比:</span>
                    <span className="text-sm font-medium text-purple-900">
                      {stats.projectCostTotal > 0 ? (stats.totalContractAmount / stats.projectCostTotal).toFixed(2) : 0}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-purple-700">平均契約金額:</span>
                    <span className="text-sm font-medium text-purple-900">
                      {projects.filter(p => p.contract_amount).length > 0
                        ? formatCurrency(stats.totalContractAmount / projects.filter(p => p.contract_amount).length)
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* プロジェクト分析サマリー */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-900 mb-4">プロジェクト分析</h4>
                <div className="space-y-3">
                  {(() => {
                    const breakdown = getProjectCostBreakdown()
                    const profitableProjects = breakdown.filter(item => item.profit > 0)
                    const lossProjects = breakdown.filter(item => item.profit < 0)

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">黒字プロジェクト:</span>
                          <span className="text-sm font-medium text-green-600">{profitableProjects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">赤字プロジェクト:</span>
                          <span className="text-sm font-medium text-red-600">{lossProjects.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">最高利益率:</span>
                          <span className="text-sm font-medium text-green-600">
                            {profitableProjects.length > 0 ? Math.max(...profitableProjects.map(p => p.profitMargin)).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">最低利益率:</span>
                          <span className="text-sm font-medium text-red-600">
                            {lossProjects.length > 0 ? Math.min(...lossProjects.map(p => p.profitMargin)).toFixed(1) : 0}%
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* エクスポート機能 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">レポートエクスポート</h3>
        </div>
        
        <div className="mt-4 space-y-6">
          {/* レポートタイプ選択 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">レポートタイプ</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="comprehensive"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">包括的分析レポート</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="profitability"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">収益性分析レポート</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="summary"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">サマリーレポート</span>
              </label>
            </div>
          </div>

          {/* エクスポート形式 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">エクスポート形式</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">CSV形式</div>
                  <div className="text-xs opacity-90">契約金額・利益率を含む詳細データ</div>
                </div>
              </button>
              <button className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Excel形式</div>
                  <div className="text-xs opacity-90">グラフ・チャート付き</div>
                </div>
              </button>
              <button className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <Download className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">PDF形式</div>
                  <div className="text-xs opacity-90">印刷用レポート</div>
                </div>
              </button>
            </div>
          </div>

          {/* 追加オプション */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">追加オプション</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">契約金額・利益率を含む</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">プロジェクト別詳細分析</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">月別推移データ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">カテゴリ別分析</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
