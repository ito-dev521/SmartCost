import { Metadata } from 'next'
import { createServerComponentClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '法人詳細 | SmartCost',
}

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerComponentClient()

  // 会社情報
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  // 件数
  const agg = async (table: string) => {
    const { count } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id)
    return count || 0
  }

  const [users, clients] = await Promise.all([
    agg('users'), agg('clients')
  ])

  // プロジェクト数：company_id 直付と clients 経由の双方をカウント
  const { data: projRows } = await supabase
    .from('projects')
    .select('company_id, client_id')

  const clientIds = Array.from(new Set((projRows || []).filter(r => !r.company_id && r.client_id).map(r => r.client_id as string)))
  let countViaClient = 0
  if (clientIds.length > 0) {
    const { data: clientsRows } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', id)
      .in('id', clientIds)
    countViaClient = (clientsRows || []).length
  }
  const countDirect = (projRows || []).filter(r => r.company_id === id).length
  const projects = countDirect + countViaClient

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href="/super-admin" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" /> 一覧に戻る
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company?.name || '法人詳細'}</h1>
          <p className="text-gray-600 text-sm">作成日: {company?.created_at ? new Date(company.created_at).toLocaleDateString('ja-JP') : '-'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">ユーザー数</p>
            <p className="text-2xl font-bold">{users}</p>
            <Link href="/users" className="text-blue-600 text-sm underline mt-2 inline-block">ユーザー一覧</Link>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">クライアント数</p>
            <p className="text-2xl font-bold">{clients}</p>
            <Link href="/clients" className="text-blue-600 text-sm underline mt-2 inline-block">クライアント一覧</Link>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">プロジェクト数</p>
            <p className="text-2xl font-bold">{projects}</p>
            <Link href="/projects" className="text-blue-600 text-sm underline mt-2 inline-block">プロジェクト一覧</Link>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">基本情報</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600">担当者</dt>
              <dd className="font-medium">{company?.contact_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-600">メール</dt>
              <dd className="font-medium">{company?.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-600">住所</dt>
              <dd className="font-medium">{company?.address || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-600">電話</dt>
              <dd className="font-medium">{company?.phone || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </DashboardLayout>
  )
}


