'use client'

import { Monitor, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

export default function CaddonToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null) // ダミー状態

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">CADDONシステムの有無（ダミー）</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">現在:</span>
          {enabled === true && (
            <span className="inline-flex items-center text-teal-700 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> 有効
            </span>
          )}
          {enabled === false && (
            <span className="inline-flex items-center text-gray-600 text-sm">
              <XCircle className="h-4 w-4 mr-1" /> 無効
            </span>
          )}
          {enabled === null && <span className="text-sm text-gray-400">—</span>}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setEnabled(true)}
          className="px-4 py-2 rounded-md border border-teal-300 text-teal-700 hover:bg-teal-50 text-sm"
        >
          有効にする（ダミー）
        </button>
        <button
          onClick={() => setEnabled(false)}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
        >
          無効にする（ダミー）
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">機能実装前のUIです。決定後に保存APIを実装します。</p>
    </div>
  )
}


