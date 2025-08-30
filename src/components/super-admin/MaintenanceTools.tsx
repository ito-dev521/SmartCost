'use client'

import { Wrench, RotateCcw, Trash2, Database } from 'lucide-react'

export default function MaintenanceTools() {
  const tools = [
    { icon: RotateCcw, label: '集計再計算', desc: '契約金額・原価の再集計', action: () => alert('ダミー: 集計再計算') },
    { icon: Trash2, label: 'キャッシュ削除', desc: 'アプリキャッシュをクリア', action: () => alert('ダミー: キャッシュ削除') },
    { icon: Database, label: 'バックアップ', desc: 'エクスポート(ダミー)', action: () => alert('ダミー: バックアップ') }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">メンテナンステール（ダミー）</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((t, i) => (
          <button
            key={i}
            onClick={t.action}
            className="flex items-start gap-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 text-left"
          >
            <t.icon className="h-5 w-5 text-gray-700 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}


