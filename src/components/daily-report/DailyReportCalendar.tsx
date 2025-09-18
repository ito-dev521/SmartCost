'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle } from 'lucide-react'

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

interface DailyReportCalendarProps {
  entries: DailyReportEntry[]
  currentDate?: Date
  selectedDate?: string // 選択された日付を追加
  onDateClick?: (date: Date) => void
  onClose?: () => void
}

export default function DailyReportCalendar({ 
  entries, 
  currentDate = new Date(),
  selectedDate,
  onDateClick,
  onClose
}: DailyReportCalendarProps) {
  const [displayDate, setDisplayDate] = useState(currentDate)

  // デバッグログ
  if (entries.length > 0) {
  }

  // 現在表示中の月の情報を計算
  const monthInfo = useMemo(() => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth() // 0ベース（0-11）
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1)
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0)
    // 月の最初の日の曜日（0=日曜日）
    const firstDayOfWeek = firstDay.getDay()
    // 月の日数
    const daysInMonth = lastDay.getDate()
    
    return { year, month, firstDay, lastDay, firstDayOfWeek, daysInMonth }
  }, [displayDate])

  // 指定された日付の入力状況をチェック
  const getEntryStatus = (date: Date) => {
    // 日付をYYYY-MM-DD形式の文字列に変換（タイムゾーン問題を回避）
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    // データベースの日付と直接比較
    const hasEntry = entries.some(entry => entry.date === dateString)
    
    const isToday = date.toDateString() === new Date().toDateString()
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    // デバッグログ（開発時のみ）
    
    return { hasEntry, isToday, isWeekend }
  }

  // 月の入力率を計算
  const inputRate = useMemo(() => {
    const { year, month } = monthInfo
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    
    let totalDays = 0
    let inputDays = 0
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const { isWeekend } = getEntryStatus(d)
      if (!isWeekend) { // 土日を除く
        totalDays++
        const dateString = d.toISOString().split('T')[0]
        if (entries.some(entry => entry.date === dateString)) {
          inputDays++
        }
      }
    }
    
    return totalDays > 0 ? Math.round((inputDays / totalDays) * 100) : 0
  }, [entries, monthInfo])

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const { firstDayOfWeek, daysInMonth } = monthInfo
    const days = []
    
    // 前月の日付を追加（週の開始を日曜日に合わせる）
    const prevMonth = new Date(monthInfo.year, monthInfo.month - 1, 0)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i))
    }
    
    // 今月の日付を追加（JavaScriptのDateは月を0ベースで扱うため、monthInfo.monthは既に正しい値）
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(monthInfo.year, monthInfo.month, day))
    }
    
    // 次月の日付を追加（週の終了を土曜日に合わせる）
    const remainingDays = 42 - days.length // 6週分（42日）に調整
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(monthInfo.year, monthInfo.month + 1, day))
    }
    
    // デバッグログ（開発時のみ）
    
    return days
  }, [monthInfo])

  // 月の移動
  const goToPreviousMonth = () => {
    setDisplayDate(new Date(monthInfo.year, monthInfo.month - 1, 1))
  }

  const goToNextMonth = () => {
    setDisplayDate(new Date(monthInfo.year, monthInfo.month + 1, 1))
  }

  const goToCurrentMonth = () => {
    setDisplayDate(new Date())
  }

  // 日付のクリック処理
  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date)
    }
  }

  // 曜日のヘッダー
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">月間入力状況</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 入力率表示 */}
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">入力率:</div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {inputRate}%
            </div>
          </div>
          
          {/* 閉じるボタン */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700"
              title="カレンダーを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 月のナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-3">
          <h4 className="text-xl font-semibold text-gray-900">
            {monthInfo.year}年{monthInfo.month + 1}月
          </h4>
          <button
            onClick={goToCurrentMonth}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            今月
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
        
                 {/* 日付セル */}
         {calendarDays.map((date, index) => {
           const { hasEntry, isToday, isWeekend } = getEntryStatus(date)
           const isCurrentMonth = date.getMonth() === monthInfo.month
           const isSelected = selectedDate && (() => {
             const year = date.getFullYear()
             const month = String(date.getMonth() + 1).padStart(2, '0')
             const day = String(date.getDate()).padStart(2, '0')
             const dateString = `${year}-${month}-${day}`
             return dateString === selectedDate
           })()
           
           return (
             <button
               key={index}
               onClick={() => handleDateClick(date)}
               disabled={!isCurrentMonth}
               className={`
                 p-2 text-sm rounded-md transition-all duration-200 h-12 flex flex-col items-center justify-center gap-1
                 ${!isCurrentMonth 
                   ? 'text-gray-300 cursor-default' 
                   : isSelected
                     ? 'bg-purple-100 text-purple-800 border-2 border-purple-500 font-semibold' // 選択された日付
                     : isToday 
                       ? 'bg-green-100 text-green-800 border-2 border-green-500 font-semibold' 
                       : hasEntry 
                         ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' 
                         : isWeekend 
                           ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer' 
                           : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                 }
               `}
             >
               <span className="text-sm font-medium">{date.getDate()}</span>
               {hasEntry && (
                 <CheckCircle className="h-4 w-4 text-blue-600" />
               )}
               {!hasEntry && !isWeekend && isCurrentMonth && (
                 <XCircle className="h-4 w-4 text-red-500" />
               )}
               {isSelected && (
                 <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
               )}
             </button>
           )
         })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>入力済み</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 rounded"></div>
            <span>未入力</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 rounded"></div>
            <span>土日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
            <span>今日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded"></div>
            <span>選択中</span>
          </div>
        </div>
      </div>
    </div>
  )
}
