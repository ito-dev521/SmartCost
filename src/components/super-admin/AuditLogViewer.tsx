'use client'

import { FileSearch } from 'lucide-react'

export default function AuditLogViewer() {
  const dummyRows = Array.from({ length: 5 }).map((_, i) => ({
    id: `dummy-${i + 1}`,
    time: '—',
    user: '—',
    action: '—',
    target: '—'
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">監査ログ（ダミー）</h3>
        </div>
        <div className="flex gap-2">
          <input className="px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="ユーザー/アクション検索" />
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option>期間: 24時間</option>
            <option>期間: 7日</option>
            <option>期間: 30日</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">時刻</th>
              <th className="py-2 pr-4">ユーザー</th>
              <th className="py-2 pr-4">操作</th>
              <th className="py-2 pr-4">対象</th>
            </tr>
          </thead>
          <tbody>
            {dummyRows.map(r => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="py-2 pr-4">{r.time}</td>
                <td className="py-2 pr-4">{r.user}</td>
                <td className="py-2 pr-4">{r.action}</td>
                <td className="py-2 pr-4">{r.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


