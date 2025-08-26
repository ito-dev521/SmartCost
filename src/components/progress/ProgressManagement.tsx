'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  business_number: string
  status: string
  client_name?: string
}

interface ProgressData {
  id: string
  project_id: string
  progress_rate: number
  progress_date: string
  notes?: string
  created_at: string
}

interface ProgressManagementProps {
  initialProjects: Project[]
  initialProgressData: ProgressData[]
}

export default function ProgressManagement({ initialProjects, initialProgressData }: ProgressManagementProps) {
  const [projects] = useState<Project[]>(initialProjects || [])
  const [progressData, setProgressData] = useState<ProgressData[]>(initialProgressData || [])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [progressRate, setProgressRate] = useState(0)
  const [progressDate, setProgressDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // 今日の日付をデフォルトに設定
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0]
      setProgressDate(today)
    } catch (error) {
      console.error('日付設定エラー:', error)
      setProgressDate('')
    }
  }, [])

    const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProjectId || progressRate === undefined || !progressDate) {
      setSubmitMessage({ type: 'error', message: '必須フィールドを入力してください' })
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      console.log('進捗記録開始:', {
        project_id: selectedProjectId,
        progress_rate: progressRate,
        progress_date: progressDate,
        notes: notes.trim() || null
      })

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          progress_rate: progressRate,
          progress_date: progressDate,
          notes: notes.trim() || null
        })
      })

      console.log('APIレスポンス:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('APIエラー詳細:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('API結果:', result)

      if (result.success) {
        setSubmitMessage({ type: 'success', message: result.message })
        
        // フォームをリセット
        setSelectedProjectId('')
        setProgressRate(0)
        setNotes('')
        
        // 進捗データを更新
        const newProgress = result.data
        setProgressData(prev => [newProgress, ...prev])
        
        // 3秒後にメッセージを消す
        setTimeout(() => setSubmitMessage(null), 3000)
      } else {
        setSubmitMessage({ type: 'error', message: result.error || '進捗の記録に失敗しました' })
      }
    } catch (error) {
      console.error('進捗記録エラー:', error)
      const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました'
      setSubmitMessage({ type: 'error', message: `エラー: ${errorMessage}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedProjectId('')
    setProgressRate(0)
    setNotes('')
    setSubmitMessage(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">進捗入力</h3>
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト
            </label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">プロジェクトを選択...</option>
              {projects?.filter(p => p.status === 'in_progress' || p.status === 'planning').map(project => (
                <option key={project.id} value={project.id}>
                  {project.business_number} - {project.name} ({project.status === 'in_progress' ? '進行中' : '計画中'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              進捗率 (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={progressRate}
              onChange={(e) => setProgressRate(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              記録日
            </label>
            <input
              type="date"
              value={progressDate}
              onChange={(e) => setProgressDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考（任意）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="進捗に関する詳細や注意事項を入力してください"
            />
          </div>
          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '記録中...' : '進捗を記録'}
            </button>
            <button 
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              リセット
            </button>
          </div>
          {submitMessage && (
            <div className={`p-3 rounded-md text-sm ${
              submitMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {submitMessage.message}
            </div>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">完了基準設定</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">工事進行基準について</h4>
            <p className="text-sm text-gray-600">
              工事進行基準では、プロジェクトの進捗に応じて収益と費用を認識します。
              進捗率に基づいて正確な収益計算を行うことができます。
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">計画段階</span>
              <span className="text-sm text-gray-600">0%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">設計段階</span>
              <span className="text-sm text-gray-600">10-20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">施工準備</span>
              <span className="text-sm text-gray-600">20-30%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">施工中</span>
              <span className="text-sm text-gray-600">30-90%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">竣工・引渡し</span>
              <span className="text-sm text-gray-600">90-100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
