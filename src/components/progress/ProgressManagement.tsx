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
  onProgressUpdate?: () => void
}

export default function ProgressManagement({ initialProjects, initialProgressData, onProgressUpdate }: ProgressManagementProps) {
  const [projects] = useState<Project[]>(initialProjects || [])
  const [progressData, setProgressData] = useState<ProgressData[]>(initialProgressData || [])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [progressRate, setProgressRate] = useState(0)
  const [loading, setLoading] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // デバッグ: コンポーネントマウント時にプロジェクトデータを確認
  useEffect(() => {
    console.log('ProgressManagement初期データ:', {
      projectsCount: projects.length,
      projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status })),
      completedProjects: projects.filter(p => p.status === 'completed'),
      allStatuses: [...new Set(projects.map(p => p.status))]
    })
  }, [projects])

  // デバッグ: 進捗率の変更を監視
  useEffect(() => {
    console.log('進捗率が変更されました:', progressRate)
  }, [progressRate])

  // デバッグ: forceUpdateの変更を監視
  useEffect(() => {
    console.log('forceUpdateが変更されました:', forceUpdate)
  }, [forceUpdate])

  // 完了プロジェクト選択時の強制設定
  useEffect(() => {
    if (selectedProjectId) {
      const selectedProject = projects.find(p => p.id === selectedProjectId)
      const status = selectedProject?.status
      const isCompleted =
        status === 'completed' ||
        status === '完了' ||
        status === 'finish' ||
        status === '完了済み' ||
        status === '終了' ||
        (status && status.toLowerCase().includes('完了')) ||
        (status && status.toLowerCase().includes('complete')) ||
        (status && status.toLowerCase().includes('finish'))

      if (isCompleted) {
        console.log('useEffect: 完了プロジェクト検知 - 強制設定開始')
        console.log('ステータス:', status, '現在の進捗率:', progressRate)

        // 即座に全ての値を設定
        const today = new Date().toISOString().split('T')[0]
        setProgressRate(100)
        setProgressDate(today)
        setNotes('完了プロジェクト')

        // DOM要素も直接操作（より具体的なセレクタを使用）
        setTimeout(() => {
          // 進捗率入力フィールド（numberタイプのinput）
          const progressInputs = document.querySelectorAll('input[type="number"]')
          const progressInput = Array.from(progressInputs).find(input =>
            input.getAttribute('min') === '0' && input.getAttribute('max') === '100'
          ) as HTMLInputElement

          // 日付入力フィールド
          const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement

          // 備考入力フィールド
          const notesTextarea = document.querySelector('textarea') as HTMLTextAreaElement

          console.log('DOM要素検索結果:', {
            progressInputs: progressInputs.length,
            progressInput: !!progressInput,
            dateInput: !!dateInput,
            notesTextarea: !!notesTextarea
          })

          if (progressInput) {
            progressInput.value = '100'
            // Reactのstateも更新
            progressInput.dispatchEvent(new Event('input', { bubbles: true }))
            console.log('DOM操作: 進捗率を100%に設定')
          }

          if (dateInput) {
            dateInput.value = today
            dateInput.dispatchEvent(new Event('input', { bubbles: true }))
            console.log('DOM操作: 日付を今日に設定')
          }

          if (notesTextarea) {
            notesTextarea.value = '完了プロジェクト'
            notesTextarea.dispatchEvent(new Event('input', { bubbles: true }))
            console.log('DOM操作: 備考を設定')
          }

          setForceUpdate(prev => prev + 1)
          console.log('useEffect: 完了プロジェクト設定完了')
        }, 100)
      }
    }
  }, [selectedProjectId, projects])
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

      console.log('=== 進捗記録開始 ===')
      console.log('フォームデータ:', {
        selectedProjectId,
        progressRate,
        progressDate,
        notes
      })

      if (!selectedProjectId || progressRate === undefined || !progressDate) {
        console.log('バリデーションエラー: 必須フィールドが不足')
        setSubmitMessage({ type: 'error', message: '必須フィールドを入力してください' })
        return
      }

      setIsSubmitting(true)
      setSubmitMessage(null)

      try {
        const requestData = {
          project_id: selectedProjectId,
          progress_rate: progressRate,
          progress_date: progressDate,
          notes: notes.trim() || null
        }

        console.log('APIリクエストデータ:', requestData)

        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        })

        console.log('APIレスポンス受信:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('APIエラー詳細:', errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log('API結果:', result)

        if (result.success) {
          console.log('API成功: 進捗記録完了')
          console.log('返却されたデータ:', result.data)

          setSubmitMessage({ type: 'success', message: result.message })

          // フォームをリセット
          console.log('フォームリセット開始')
          setSelectedProjectId('')
          setProgressRate(0)
          setNotes('')

          // 進捗データを更新
          const newProgress = result.data
          console.log('進捗データ更新:', newProgress)
          setProgressData(prev => [newProgress, ...prev])

          // 100%の場合はプロジェクトのステータスを即時で"completed"に更新
          try {
            if (Number(progressRate) >= 100 && selectedProjectId) {
              console.log('進捗率100%: プロジェクトステータスをcompletedへ更新開始')
              const supabase = createClientComponentClient()
              const { error: statusErr } = await supabase
                .from('projects')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', selectedProjectId)

              if (statusErr) {
                console.error('クライアント側ステータス更新エラー:', statusErr)
              } else {
                console.log('クライアント側ステータス更新成功')
              }
            }
          } catch (e) {
            console.error('クライアント側ステータス更新例外:', e)
          }

          // 親コンポーネントに更新を通知
          console.log('親コンポーネントに更新通知')
          if (onProgressUpdate) {
            setTimeout(() => {
              console.log('onProgressUpdateコールバック実行')
              onProgressUpdate()
            }, 500)
          } else {
            // フォールバック：ページリロード
            console.log('コールバックなし：ページリロード実行')
            setTimeout(() => {
              window.location.reload(true)
            }, 1500)
          }

          // 3秒後にメッセージを消す
          setTimeout(() => {
            console.log('成功メッセージを消去')
            setSubmitMessage(null)
          }, 3000)
        } else {
          console.log('APIエラー: success=false')
          console.log('エラーメッセージ:', result.error)
          setSubmitMessage({ type: 'error', message: result.error || '進捗の記録に失敗しました' })
        }
      } catch (error) {
        console.error('進捗記録エラー:', error)
        const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました'
        console.log('最終エラーメッセージ:', errorMessage)
        setSubmitMessage({ type: 'error', message: `エラー: ${errorMessage}` })
      } finally {
        console.log('処理完了: isSubmittingをfalseに設定')
        setIsSubmitting(false)
      }
  }

  // プロジェクト選択時の処理
  const handleProjectChange = async (projectId: string) => {
    console.log('=== プロジェクト選択開始 ===')
    console.log('選択されたプロジェクトID:', projectId)
    console.log('現在のprogressDate:', progressDate)

    setSelectedProjectId(projectId)
    setLoading(true)

    if (!projectId) {
      console.log('プロジェクト未選択: 進捗率を0にリセット')
      setProgressRate(0)
      setLoading(false)
      return
    }

    try {
      // 選択されたプロジェクト情報を取得
      const selectedProject = projects.find(p => p.id === projectId)
      console.log('選択されたプロジェクト:', selectedProject)

      // デバッグ: プロジェクト情報とステータスを確認
      console.log('プロジェクト選択詳細:', {
        projectId,
        selectedProject,
        status: selectedProject?.status,
        allStatuses: projects.map(p => ({ id: p.id, status: p.status }))
      })

      // プロジェクトのステータスが完了の場合は進捗率を100%に設定
      // より厳密な判定を行う
      const status = selectedProject?.status
      const isCompleted =
        status === 'completed' ||
        status === '完了' ||
        status === 'finish' ||
        status === '完了済み' ||
        status === '終了' ||
        (status && status.toLowerCase().includes('完了')) ||
        (status && status.toLowerCase().includes('complete')) ||
        (status && status.toLowerCase().includes('finish'))

      console.log('完了判定詳細:', {
        originalStatus: status,
        lowerCaseStatus: status?.toLowerCase(),
        isCompleted,
        allConditions: {
          exactCompleted: status === 'completed',
          exact完了: status === '完了',
          exactFinish: status === 'finish',
          exact完了済み: status === '完了済み',
          exact終了: status === '終了',
          includes完了: status?.toLowerCase().includes('完了'),
          includesComplete: status?.toLowerCase().includes('complete'),
          includesFinish: status?.toLowerCase().includes('finish')
        }
      })

      if (isCompleted) {
        console.log('=== 完了プロジェクト検知 ===')
        console.log('ステータス:', selectedProject?.status)
        console.log('現在のprogressRate:', progressRate)

        // 完了プロジェクトの場合は即座に全てを設定
        const today = new Date().toISOString().split('T')[0]

        console.log('完了プロジェクト: 即時設定開始')
        setProgressRate(100)
        setProgressDate(today)
        setNotes('完了プロジェクト')
        setLoading(false)

        console.log('完了プロジェクト: 設定完了 - 進捗率=100%, 日付=' + today)

        // 念のため、少し遅れて再確認
        setTimeout(() => {
          if (progressRate !== 100) {
            console.log('完了プロジェクト: 再設定実行')
            setProgressRate(100)
            setForceUpdate(prev => prev + 1)
          }
        }, 200)

        console.log('=== 完了プロジェクト処理完了 ===')
        return
      }

      // それ以外の場合は最新の進捗データを取得
      console.log('=== 未完了プロジェクトの処理 ===')
      const projectProgress = progressData.filter(p => p.project_id === projectId)
      const latestProgress = projectProgress.sort((a, b) => {
        const bTime = new Date((b as any).created_at || b.progress_date).getTime()
        const aTime = new Date((a as any).created_at || a.progress_date).getTime()
        return bTime - aTime
      })[0]

      console.log('進捗データ取得結果:', {
        projectId,
        projectProgressCount: projectProgress.length,
        latestProgress: latestProgress ? {
          progress_rate: latestProgress.progress_rate,
          progress_date: latestProgress.progress_date
        } : null
      })

      // 最新の進捗率をフォームにセット
      if (latestProgress) {
        console.log('既存の進捗データを設定:', latestProgress.progress_rate)
        setProgressRate(latestProgress.progress_rate || 0)
      } else {
        console.log('進捗データなし: 0を設定')
        setProgressRate(0) // 進捗データがない場合は0
      }
      console.log('=== 未完了プロジェクト処理完了 ===')
    } catch (error) {
      console.error('プロジェクト進捗データ取得エラー:', error)
      setProgressRate(0)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProjectId('')
    setProgressRate(0)
    setNotes('')
    setSubmitMessage(null)
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" key={forceUpdate}>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">進捗入力</h3>
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">プロジェクトを選択...</option>
              {projects?.filter(p => p.status === 'in_progress' || p.status === 'planning' || p.status === 'completed').map(project => {
                const isSelected = project.id === selectedProjectId
                // 進捗率が100%か、選択中プロジェクトが完了扱いなら表示文言を完了に
                const labelStatus = (isSelected && Number(progressRate) >= 100)
                  ? '完了'
                  : project.status === 'in_progress'
                    ? '進行中'
                    : project.status === 'planning'
                      ? '計画中'
                      : '完了'
                return (
                  <option key={project.id} value={project.id}>
                    {project.business_number} - {project.name} ({labelStatus})
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              進捗率 (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={progressRate}
                onChange={(e) => setProgressRate(Number(e.target.value))}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                ref={(input) => {
                  // 完了プロジェクトの場合に強制的に100%を設定
                  if (input && selectedProjectId) {
                    const selectedProject = projects.find(p => p.id === selectedProjectId)
                    const isCompleted = selectedProject?.status === 'completed' ||
                                       selectedProject?.status === '完了' ||
                                       selectedProject?.status === 'finish' ||
                                       selectedProject?.status === '完了済み' ||
                                       selectedProject?.status === '終了' ||
                                       selectedProject?.status?.toLowerCase().includes('完了') ||
                                       selectedProject?.status?.toLowerCase().includes('complete') ||
                                       selectedProject?.status?.toLowerCase().includes('finish')

                    if (isCompleted && input.value !== '100') {
                      console.log('input refで完了プロジェクトを検知: 強制的に100%に設定')
                      input.value = '100'
                      setProgressRate(100)
                      setForceUpdate(prev => prev + 1) // 強制再レンダリング
                    }
                  }
                }}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {selectedProjectId && !loading && (
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const selectedProject = projects.find(p => p.id === selectedProjectId)
                  const isCompleted = selectedProject?.status === 'completed' ||
                                     selectedProject?.status === '完了' ||
                                     selectedProject?.status === 'finish' ||
                                     selectedProject?.status === '完了済み' ||
                                     selectedProject?.status === '終了' ||
                                     selectedProject?.status?.toLowerCase().includes('完了') ||
                                     selectedProject?.status?.toLowerCase().includes('complete') ||
                                     selectedProject?.status?.toLowerCase().includes('finish')

                  return isCompleted
                    ? '※ 完了済みのプロジェクトのため、進捗率を100%に設定しました'
                    : '※ 現在の最新進捗率が自動入力されました'
                })()}
              </p>
            )}
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
