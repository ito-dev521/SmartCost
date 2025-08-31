'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Building2, Database, Activity, Monitor } from 'lucide-react'

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<{ companyCount: number; auditCount: number; dbSizeMb: number | null; caddonLinked: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/super-admin/metrics')
        if (!res.ok) throw new Error('メトリクスの取得に失敗しました')
        const data = await res.json()
        setMetrics(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラー')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const cards = [
    { title: '登録法人', value: metrics ? String(metrics.companyCount) : '—', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', note: '' },
    { title: '監査ログ(24h)', value: metrics ? String(metrics.auditCount) : '—', icon: Activity, color: 'text-green-600', bg: 'bg-green-50', note: '' },
    { title: 'DBサイズ', value: metrics && metrics.dbSizeMb != null ? `${metrics.dbSizeMb} MB` : '—', icon: Database, color: 'text-purple-600', bg: 'bg-purple-50', note: metrics && metrics.dbSizeMb == null ? '未対応' : '' },
    { title: 'CADDON連携', value: metrics ? (metrics.caddonLinked ? '有効' : '無効') : '—', icon: Monitor, color: 'text-orange-600', bg: 'bg-orange-50', note: '' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">スーパー管理者ダッシュボード</h2>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-gray-600">読み込み中...</div>
      ) : error ? (
        <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{c.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
                  {c.note && <p className="text-xs text-gray-400 mt-1">{c.note}</p>}
                </div>
                <div className={`p-3 rounded-full ${c.bg}`}>
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


