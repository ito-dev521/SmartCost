'use client'

import { ShieldCheck, Building2, Database, Activity, Monitor } from 'lucide-react'

export default function SuperAdminDashboard() {
  const cards = [
    { title: '登録法人', value: '—', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', note: 'ダミー表示' },
    { title: '監査ログ(24h)', value: '—', icon: Activity, color: 'text-green-600', bg: 'bg-green-50', note: 'ダミー表示' },
    { title: 'DBサイズ', value: '—', icon: Database, color: 'text-purple-600', bg: 'bg-purple-50', note: 'ダミー表示' },
    { title: 'CADDON連携', value: '—', icon: Monitor, color: 'text-orange-600', bg: 'bg-orange-50', note: 'ダミー表示' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">スーパー管理者ダッシュボード（ダミーUI）</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{c.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.note}</p>
              </div>
              <div className={`p-3 rounded-full ${c.bg}`}>
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


