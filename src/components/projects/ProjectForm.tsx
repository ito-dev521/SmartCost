'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'
import { X } from 'lucide-react'

type Project = Tables<'projects'>

interface ProjectFormProps {
  project: Project | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    contract_amount: '',
    start_date: '',
    end_date: '',
    completion_method: 'percentage',
    progress_calculation_method: 'cost_ratio',
    status: 'active',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        client_name: project.client_name || '',
        contract_amount: project.contract_amount?.toString() || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        completion_method: project.completion_method || 'percentage',
        progress_calculation_method: project.progress_calculation_method || 'cost_ratio',
        status: project.status || 'active',
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const projectData = {
        name: formData.name,
        client_name: formData.client_name || null,
        contract_amount: formData.contract_amount ? parseFloat(formData.contract_amount) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        completion_method: formData.completion_method,
        progress_calculation_method: formData.progress_calculation_method,
        status: formData.status,
        company_id: 'company-1', // TODO: 実際のcompany_idを取得
        updated_at: new Date().toISOString(),
      }

      if (project) {
        // 更新
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('projects')
          .insert([{
            ...projectData,
            created_at: new Date().toISOString(),
          }])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('プロジェクトの保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {project ? 'プロジェクト編集' : '新規プロジェクト作成'}
              </h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* プロジェクト名 */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    プロジェクト名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="道路設計業務A"
                  />
                </div>

                {/* クライアント名 */}
                <div className="sm:col-span-2">
                  <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                    クライアント名
                  </label>
                  <input
                    type="text"
                    name="client_name"
                    id="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="○○市役所"
                  />
                </div>

                {/* 契約金額 */}
                <div>
                  <label htmlFor="contract_amount" className="block text-sm font-medium text-gray-700">
                    契約金額（円）
                  </label>
                  <input
                    type="number"
                    name="contract_amount"
                    id="contract_amount"
                    value={formData.contract_amount}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25000000"
                  />
                </div>

                {/* ステータス */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    ステータス
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">進行中</option>
                    <option value="completed">完了</option>
                    <option value="suspended">中断</option>
                  </select>
                </div>

                {/* 開始日 */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    開始日
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 終了日 */}
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    終了日
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 完成基準 */}
                <div>
                  <label htmlFor="completion_method" className="block text-sm font-medium text-gray-700">
                    完成基準
                  </label>
                  <select
                    name="completion_method"
                    id="completion_method"
                    value={formData.completion_method}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="completed">完成基準</option>
                    <option value="percentage">工事進行基準</option>
                  </select>
                </div>

                {/* 進捗率計算方法 */}
                <div>
                  <label htmlFor="progress_calculation_method" className="block text-sm font-medium text-gray-700">
                    進捗率計算方法
                  </label>
                  <select
                    name="progress_calculation_method"
                    id="progress_calculation_method"
                    value={formData.progress_calculation_method}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cost_ratio">原価比例法</option>
                    <option value="work_ratio">工事量比例法</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
                >
                  {loading ? '保存中...' : (project ? '更新' : '作成')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
