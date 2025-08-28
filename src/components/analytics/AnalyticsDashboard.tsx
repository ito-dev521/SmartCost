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
import CategoryCostChart from './CategoryCostChart'

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
  const [loadingSplitBilling, setLoadingSplitBilling] = useState(false)

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['total-performance']))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [clients, setClients] = useState<Client[]>([])
  const [caddonBillings, setCaddonBillings] = useState<CaddonBilling[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null)
  const [editingSplitBilling, setEditingSplitBilling] = useState<string | null>(null)
  const [editingMonth, setEditingMonth] = useState<{projectId: string, month: string} | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: string}>({})
  const [splitBillingLoaded, setSplitBillingLoaded] = useState(false)
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<any>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  // 認証状況を確認
  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (process.env.NODE_ENV === 'development') {
        console.log('認証状況:', { user: !!user, error, userId: user?.id })
      }
      if (error) {
        console.error('認証エラー:', error)
      }
    } catch (error) {
      console.error('認証チェックエラー:', error)
    }
  }

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

  // プロジェクト情報を含む原価エントリデータを取得
  const getEnrichedCostEntries = () => {
    return costEntries.map(entry => {
      const project = projects.find(p => p.id === entry.project_id)
      return {
        ...entry,
        project: project ? {
          name: project.name,
          business_number: project.business_number
        } : undefined
      }
    })
  }

  // フィルタリングされたデータを取得
  const getFilteredData = () => {
    let filtered = getEnrichedCostEntries()

    if (process.env.NODE_ENV === 'development') {
      console.log('原価エントリの詳細:', {
        totalEntries: filtered.length,
        entryTypes: filtered.reduce((acc, entry) => {
          acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1
          return acc
        }, {} as { [key: string]: number }),
        sampleEntries: filtered.slice(0, 3).map(entry => ({
          id: entry.id,
          entry_type: entry.entry_type,
          category_id: entry.category_id,
          amount: entry.amount,
          description: entry.description
        }))
      })
    }

    // 一時的にフィルタリングを無効にして、entry_typeを確認
    const originalFiltered = filtered
    // filtered = filtered.filter(entry => entry.entry_type === 'salary_allocation')

    if (process.env.NODE_ENV === 'development') {
      console.log('フィルタリング結果:', {
        originalCount: originalFiltered.length,
        filteredCount: filtered.length,
        filteredByType: filtered.reduce((acc, entry) => {
          acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
      })
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

  // プロジェクト詳細データを取得
  const getProjectDetailData = (projectId: string) => {
    const filteredData = getFilteredData().filter(entry => entry.project_id === projectId)
    const project = projects.find(p => p.id === projectId)
    
    if (!project) return null

    // カテゴリ別内訳
    const categoryBreakdown = categories.map(category => {
      const categoryCosts = filteredData.filter(entry => entry.category_id === category.id)
      const amount = categoryCosts.reduce((sum, entry) => sum + entry.amount, 0)
      
      return {
        id: category.id,
        name: category.name,
        amount
      }
    }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount)

    // 月別内訳
    const monthlyBreakdown = filteredData.reduce((acc: any[], entry) => {
      const date = new Date(entry.entry_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = `${date.getFullYear()}年${date.getMonth() + 1}月`
      
      const existingMonth = acc.find(item => item.monthKey === monthKey)
      if (existingMonth) {
        existingMonth.amount += entry.amount
      } else {
        acc.push({
          monthKey,
          month: monthName,
          amount: entry.amount,
          cumulative: 0
        })
      }
      
      return acc
    }, []).sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    // 累計を計算
    let cumulative = 0
    monthlyBreakdown.forEach(month => {
      cumulative += month.amount
      month.cumulative = cumulative
    })

    return {
      project,
      categoryBreakdown,
      monthlyBreakdown,
      recentEntries: filteredData
        .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        .slice(0, 10) // 最新10件
    }
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
      
      // 支払い月オフセットを考慮して計算
      const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
      
      // 完了月から支払い月オフセット分を加算
      const targetYear = end.getFullYear()
      const targetMonth = end.getMonth() + paymentMonthOffset
      
      // 年をまたぐ場合の処理
      const finalYear = targetMonth >= 12 ? targetYear + Math.floor(targetMonth / 12) : targetYear
      const finalMonth = targetMonth >= 12 ? targetMonth % 12 : targetMonth
      
      if (process.env.NODE_ENV === 'development') {
        console.log('計算過程:', {
          endMonth: end.getMonth(),
          endYear: end.getFullYear(),
          paymentMonthOffset,
          targetMonth,
          finalYear,
          finalMonth
        })
      }
      
      paymentDate.setFullYear(finalYear)
      paymentDate.setMonth(finalMonth)
      paymentDate.setDate(new Date(finalYear, finalMonth + 1, 0).getDate()) // その月の末日
      
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

      if (project.business_number?.startsWith('C') || project.name.includes('CADDON')) {
        // CADDONプロジェクトの場合（業務番号がCで始まる場合、またはプロジェクト名にCADDONが含まれる場合）
        if (process.env.NODE_ENV === 'development') {
          console.log('CADDONプロジェクト処理:', {
            businessNumber: project.business_number,
            projectName: project.name,
            isBusinessNumberC: project.business_number?.startsWith('C'),
            isNameContainsCADDON: project.name.includes('CADDON')
          })
        }
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
        clientName: (project.business_number?.startsWith('C') || project.name.includes('CADDON')) ? '-' : (project.client_name || ''),
        businessNumber: project.business_number,
        startDate: (project.business_number?.startsWith('C') || project.name.includes('CADDON')) ? null : project.start_date,
        endDate: (project.business_number?.startsWith('C') || project.name.includes('CADDON')) ? null : project.end_date,
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

  // プロジェクトが中止されているかチェック
  const isProjectCancelled = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.status === 'cancelled'
  }

  // 月次編集のタイトルを取得
  const getMonthEditTitle = (item: MonthlyRevenue) => {
    if (item.businessNumber?.startsWith('C') || item.projectName.includes('CADDON')) {
      return 'CADDONシステムのため編集できません'
    }
    if (isProjectCancelled(item.projectId)) {
      return 'プロジェクトが中止されているため編集できません'
    }
    return '分割請求を開始'
  }

  // 年間合計を計算
  const calculateYearlyTotal = (item: MonthlyRevenue) => {
    const fiscalYearStart = (fiscalInfo?.settlement_month || 3) + 1
    let yearlyTotal = 0
    for (let i = 0; i < 12; i++) {
      const month = (fiscalYearStart + i - 1) % 12 + 1
      const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
      yearlyTotal += amount
    }
    return yearlyTotal
  }

  // 月次編集を開始
  const startMonthEdit = (projectId: string, month: string) => {
    // 中止プロジェクトの場合は編集を開始しない
    if (isProjectCancelled(projectId)) {
      return
    }
    
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
  const saveMonthEdit = async (projectId: string, month: string, amount: number) => {
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
    
    // 分割入金データをAPIに保存
    try {
      const currentItem = monthlyRevenue.find(item => item.projectId === projectId)
      if (currentItem) {
        const newSplitBillingAmounts = { ...currentItem.splitBillingAmounts, [month]: amount }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('APIリクエスト送信:', {
            url: '/api/split-billing',
            method: 'POST',
            projectId,
            monthlyData: newSplitBillingAmounts
          })
        }
        
        // セッショントークンを取得
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        
        if (!accessToken) {
          throw new Error('認証トークンが取得できません')
        }
        
        const response = await fetch('/api/split-billing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            projectId,
            monthlyData: newSplitBillingAmounts
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('APIレスポンスエラー:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          })
          throw new Error(`分割入金データの保存に失敗しました (${response.status}: ${response.statusText})`)
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('分割入金データ保存成功:', { projectId, month, amount })
        }
      }
    } catch (error) {
      console.error('分割入金データ保存エラー:', error)
      alert('分割入金データの保存に失敗しました')
    }
    
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
      const month = (fiscalYearStart + i - 1) % 12 + 1
      const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
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

    // 年間入金予定表専用PDFエクスポート
  const exportToPDF = () => {
    // 印刷専用のコンテナを作成
    const printContainer = document.createElement('div')
    printContainer.id = 'print-container'
            printContainer.innerHTML = `
      <div style="padding: 20px; font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">年間入金予定表</h2>
          <p style="font-size: 14px; color: #666; margin: 0;">${selectedYear}年度</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; min-width: 60px;">業務番号</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; min-width: 120px;">プロジェクト名</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; min-width: 80px;">クライアント名</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; min-width: 50px;">開始日</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; min-width: 50px;">終了日</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold; min-width: 70px;">契約金額</th>
              ${fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                const fiscalYearStart = fiscalInfo.settlement_month + 1
                const month = (fiscalYearStart + i - 1) % 12 + 1
                return `<th style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold; min-width: 45px;">${month}月</th>`
              }).join('')}
              <th style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold; min-width: 70px;">年間合計</th>
              <th style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: bold; min-width: 60px;">ステータス</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyRevenue.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.businessNumber || ''}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.projectName}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.clientName}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.startDate ? new Date(item.startDate).toLocaleDateString('ja-JP') : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${item.endDate ? new Date(item.endDate).toLocaleDateString('ja-JP') : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${(() => {
                  const project = projects.find(p => p.id === item.projectId)
                  if (project?.status === 'cancelled') return '-'
                  return item.contractAmount ? formatCurrency(item.contractAmount) : ''
                })()}</td>
                ${fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                  const fiscalYearStart = fiscalInfo.settlement_month + 1
                  const month = (fiscalYearStart + i - 1) % 12 + 1
                  const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
                  const monthKey = `${year}-${String(month).padStart(2, '0')}`
                  const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
                  const project = projects.find(p => p.id === item.projectId)
                  return `<td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${project?.status === 'cancelled' ? '-' : (amount > 0 ? formatCurrency(amount) : '-')}</td>`
                }).join('')}
                                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">${(() => {
                    const project = projects.find(p => p.id === item.projectId)
                    if (project?.status === 'cancelled') return '-'
                    return formatCurrency(calculateYearlyTotal(item))
                  })()}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                  ${(() => {
                    const project = projects.find(p => p.id === item.projectId)
                    if (!project) return '-'
                    
                    const statusMap: { [key: string]: string } = {
                      'completed': '完了',
                      'in_progress': '進行中',
                      'planning': '計画中',
                      'on_hold': '保留中',
                      'cancelled': '中止'
                    }
                    
                    return statusMap[project.status] || '未設定'
                  })()}
                </td>
              </tr>
            `).join('')}
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 6px;">合計</td>
              <td colspan="4" style="border: 1px solid #ddd; padding: 6px;"></td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(monthlyRevenue.reduce((sum, item) => {
                const project = projects.find(p => p.id === item.projectId)
                if (project?.status === 'cancelled') return sum
                return sum + (item.contractAmount || 0)
              }, 0))}</td>
              ${fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                const fiscalYearStart = fiscalInfo.settlement_month + 1
                const month = (fiscalYearStart + i - 1) % 12 + 1
                const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
                const monthKey = `${year}-${String(month).padStart(2, '0')}`
                const total = monthlyRevenue.reduce((sum, item) => {
                  const project = projects.find(p => p.id === item.projectId)
                  if (project?.status === 'cancelled') return sum
                  const amount = item.splitBillingAmounts[monthKey] || item.monthlyAmounts[monthKey] || 0
                  return sum + amount
                }, 0)
                return `<td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(total)}</td>`
              }).join('')}
              <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${formatCurrency(monthlyRevenue.reduce((sum, item) => {
                const project = projects.find(p => p.id === item.projectId)
                if (project?.status === 'cancelled') return sum
                return sum + item.totalRevenue
              }, 0))}</td>
              <td style="border: 1px solid #ddd; padding: 6px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
    
    // 印刷用のスタイルを追加
    const printStyle = document.createElement('style')
    printStyle.id = 'annual-revenue-print-style'
    printStyle.textContent = `
      @media print {
        /* 既存のコンテンツを非表示 */
        body > *:not(#print-container) {
          display: none !important;
        }
        
        /* 印刷コンテナを表示 */
        #print-container {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* ページ設定 */
        @page {
          size: A3 landscape;
          margin: 15mm;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      }
    `
    
    // 既存のスタイルとコンテナを削除
    const existingStyle = document.getElementById('annual-revenue-print-style')
    const existingContainer = document.getElementById('print-container')
    if (existingStyle) existingStyle.remove()
    if (existingContainer) existingContainer.remove()
    
    // 新しいコンテナとスタイルを追加
    document.body.appendChild(printContainer)
    document.head.appendChild(printStyle)
    
    // 印刷実行
    window.print()
    
    // 印刷後にコンテナとスタイルを削除
    setTimeout(() => {
      const containerToRemove = document.getElementById('print-container')
      const styleToRemove = document.getElementById('annual-revenue-print-style')
      if (containerToRemove) containerToRemove.remove()
      if (styleToRemove) styleToRemove.remove()
    }, 1000)
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

  const toggleSection = async (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
    
    // 年間入金予定表が初めて開かれた時に分割入金データを読み込み
    if (section === 'annual-revenue' && newExpanded.has(section) && !splitBillingLoaded && monthlyRevenue.length > 0) {
      setSplitBillingLoaded(true)
      await loadSplitBillingDataOnDemand()
    }
  }

  // オンデマンドで分割入金データを読み込み
  const loadSplitBillingDataOnDemand = async () => {
    setLoadingSplitBilling(true)
    try {
      // セッショントークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        console.warn('認証トークンが取得できません。分割入金データの読み込みをスキップします。')
        return
      }
      
      // 全プロジェクトの分割入金データを一括取得
      const response = await fetch('/api/split-billing?allProjects=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const { projectData } = await response.json()
        
        // 各プロジェクトに分割入金データを設定
        setMonthlyRevenue(prev => prev.map(item => {
          if (projectData[item.projectId]) {
            const splitBillingAmounts = projectData[item.projectId]
            const total = Object.values(splitBillingAmounts).reduce((sum: number, val: any) => sum + val, 0)
            
            return {
              ...item,
              splitBillingAmounts,
              isSplitBilling: true,
              totalRevenue: total
            }
          }
          return item
        }))
        
        if (process.env.NODE_ENV === 'development') {
          console.log('分割入金データオンデマンド読み込み完了')
        }
      } else {
        console.warn('分割入金データの一括取得に失敗しました。')
      }
    } catch (error) {
      console.error('分割入金データオンデマンド読み込みエラー:', error)
    } finally {
      setLoadingSplitBilling(false)
    }
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
              {projects
                .filter(project => {
                  // CADDONシステムと一般管理費を除外
                  const isCaddonSystem = (
                    (project.business_number && project.business_number.startsWith('C')) ||
                    (project.name && project.name.includes('CADDON'))
                  )
                  const isOverhead = (
                    project.name === '一般管理費' ||
                    project.business_number === 'OVERHEAD'
                  )
                  return !isCaddonSystem && !isOverhead
                })
                .map((project) => (
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
                    <tr 
                      key={item.project.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const detailData = getProjectDetailData(item.project.id)
                        setSelectedProjectDetail({
                          ...item,
                          categoryBreakdown: detailData?.categoryBreakdown,
                          monthlyBreakdown: detailData?.monthlyBreakdown
                        })
                        setShowProjectModal(true)
                      }}
                    >
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
            <CategoryCostChart 
              categoryData={categoryBreakdown} 
              costEntries={getEnrichedCostEntries()} 
              selectedProject={selectedProject}
            />
          </div>
        )}
      </div>

      {/* 年間入金予定表 */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 annual-revenue-section">
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
          <div className="mt-4 annual-revenue-content">
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
            ) : loadingSplitBilling ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500">分割入金データを読み込み中...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="print-title mb-4" style={{ display: 'none' }}>
                  <h2 className="text-xl font-bold text-center mb-2">年間入金予定表</h2>
                  <p className="text-center text-gray-600">{selectedYear}年度</p>
                </div>
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
                      const fiscalYearStart = fiscalInfo.settlement_month + 1
                      const month = (fiscalYearStart + i - 1) % 12 + 1
                      const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
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
                      ステータス
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
                        {item.startDate ? new Date(item.startDate).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.endDate ? new Date(item.endDate).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-600" data-amount="true">
                        {isProjectCancelled(item.projectId) ? '-' : (item.contractAmount ? formatCurrency(item.contractAmount) : '')}
                      </td>
                      {fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                        const fiscalYearStart = fiscalInfo.settlement_month + 1
                        const month = (fiscalYearStart + i - 1) % 12 + 1
                        const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
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
                                  disabled={isProjectCancelled(item.projectId)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isProjectCancelled(item.projectId)) {
                                      const value = e.currentTarget.value.replace(/[,\s]/g, '')
                                      saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                    } else if (e.key === 'Escape') {
                                      cancelMonthEdit()
                                    }
                                  }}
                                  onChange={(e) => {
                                    if (isProjectCancelled(item.projectId)) return
                                    const value = e.target.value.replace(/[^\d]/g, '')
                                    const numValue = value ? parseInt(value, 10) : 0
                                    setEditValues(prev => ({
                                      ...prev,
                                      [`${item.projectId}-${monthKey}`]: numValue.toLocaleString('ja-JP')
                                    }))
                                  }}
                                  onBlur={() => {
                                    if (isProjectCancelled(item.projectId)) return
                                    const value = editValues[`${item.projectId}-${monthKey}`]?.replace(/[,\s]/g, '') || '0'
                                    saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (isProjectCancelled(item.projectId)) return
                                    const value = editValues[`${item.projectId}-${monthKey}`]?.replace(/[,\s]/g, '') || '0'
                                    saveMonthEdit(item.projectId, monthKey, Number(value) || 0)
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                  disabled={isProjectCancelled(item.projectId)}
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
                                className={(item.businessNumber?.startsWith('C') || item.projectName.includes('CADDON') || isProjectCancelled(item.projectId)) ? '' : 'cursor-pointer hover:text-blue-600'}
                                onClick={(item.businessNumber?.startsWith('C') || item.projectName.includes('CADDON') || isProjectCancelled(item.projectId)) ? undefined : () => startMonthEdit(item.projectId, monthKey)}
                                title={getMonthEditTitle(item)}
                              >
                                {isProjectCancelled(item.projectId) ? '-' : (amount > 0 ? formatCurrency(amount) : '-')}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900" data-amount="true">
                        <span className={
                          (item.businessNumber?.startsWith('C') || item.projectName.includes('CADDON')) ? 'text-black' : 
                          (calculateYearlyTotal(item) !== (item.contractAmount || 0) ? 'text-red-600' : '')
                        }>
                          {isProjectCancelled(item.projectId) ? '-' : formatCurrency(calculateYearlyTotal(item))}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const project = projects.find(p => p.id === item.projectId)
                          if (!project) return '-'
                          
                          const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
                            'completed': { text: '完了', color: 'text-green-800', bgColor: 'bg-green-100' },
                            'in_progress': { text: '進行中', color: 'text-blue-800', bgColor: 'bg-blue-100' },
                            'planning': { text: '計画中', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
                            'on_hold': { text: '保留中', color: 'text-gray-800', bgColor: 'bg-gray-100' },
                            'cancelled': { text: '中止', color: 'text-red-800', bgColor: 'bg-red-100' }
                          }
                          
                          const status = statusMap[project.status] || { text: '未設定', color: 'text-gray-800', bgColor: 'bg-gray-100' }
                          
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.bgColor} ${status.color}`}>
                              {status.text}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                  {/* 合計行 */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="sticky left-0 bg-gray-100 px-3 py-2 text-sm text-gray-900">合計</td>
                    <td className="px-3 py-2 text-sm text-gray-900" colSpan={4}></td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {formatCurrency(monthlyRevenue.reduce((sum, item) => {
                        // 中止プロジェクトは除外
                        if (isProjectCancelled(item.projectId)) return sum
                        return sum + (item.contractAmount || 0)
                      }, 0))}
                    </td>
                    {fiscalInfo && Array.from({ length: 12 }, (_, i) => {
                      const fiscalYearStart = fiscalInfo.settlement_month + 1
                      const month = (fiscalYearStart + i - 1) % 12 + 1
                      const year = month < fiscalYearStart ? selectedYear + 1 : selectedYear
                      const monthKey = `${year}-${String(month).padStart(2, '0')}`
                      const total = monthlyRevenue.reduce((sum, item) => {
                        // 中止プロジェクトは除外
                        if (isProjectCancelled(item.projectId)) return sum
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
                      {formatCurrency(monthlyRevenue.reduce((sum, item) => {
                        // 中止プロジェクトは除外
                        if (isProjectCancelled(item.projectId)) return sum
                        return sum + item.totalRevenue
                      }, 0))}
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

      {/* プロジェクト詳細ポップアップ */}
      {showProjectModal && selectedProjectDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                プロジェクト詳細: {selectedProjectDetail.project.name}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">基本情報</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">プロジェクト名:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedProjectDetail.project.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">業務番号:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedProjectDetail.project.business_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ステータス:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProjectDetail.project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedProjectDetail.project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedProjectDetail.project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        selectedProjectDetail.project.status === 'on_hold' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProjectDetail.project.status === 'completed' ? '完了' :
                         selectedProjectDetail.project.status === 'in_progress' ? '進行中' :
                         selectedProjectDetail.project.status === 'planning' ? '計画中' :
                         selectedProjectDetail.project.status === 'on_hold' ? '保留中' : '中止'}
                      </span>
                    </div>
                    {selectedProjectDetail.project.client_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">クライアント:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedProjectDetail.project.client_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">収益性指標</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">契約金額:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedProjectDetail.contractAmount > 0 ? formatCurrency(selectedProjectDetail.contractAmount) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">原価合計:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(selectedProjectDetail.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">利益:</span>
                      <span className={`text-sm font-medium ${selectedProjectDetail.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProjectDetail.contractAmount > 0 ? formatCurrency(selectedProjectDetail.profit) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">利益率:</span>
                      <span className={`text-sm font-medium ${selectedProjectDetail.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProjectDetail.contractAmount > 0 ? `${selectedProjectDetail.profitMargin.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* カテゴリ別原価内訳 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">カテゴリ別原価内訳</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">割合</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProjectDetail.categoryBreakdown?.length > 0 ? (
                        selectedProjectDetail.categoryBreakdown.map((category: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{category.name}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {formatCurrency(category.amount)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {selectedProjectDetail.total > 0 ? ((category.amount / selectedProjectDetail.total) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">
                            カテゴリ別内訳データがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 月別原価推移 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">月別原価推移</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">月</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">累計</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProjectDetail.monthlyBreakdown?.length > 0 ? (
                        selectedProjectDetail.monthlyBreakdown.map((month: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{month.month}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {formatCurrency(month.amount)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {formatCurrency(month.cumulative)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">
                            月別推移データがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 最近の原価エントリ */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">最近の原価エントリ（最新10件）</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProjectDetail.recentEntries?.length > 0 ? (
                        selectedProjectDetail.recentEntries.map((entry: any, index: number) => {
                          const category = categories.find(c => c.id === entry.category_id)
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(entry.entry_date).toLocaleDateString('ja-JP')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {category?.name || '未分類'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {entry.description || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {formatCurrency(entry.amount)}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">
                            原価エントリデータがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
