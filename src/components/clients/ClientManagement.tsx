'use client'

import { useState } from 'react'
import { Client } from '@/types/database'
import ClientList from './ClientList'
import ClientForm, { ClientFormData } from './ClientForm'
import { AdminGuard } from '@/components/auth/PermissionGuard'

export default function ClientManagement() {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const handleCreate = () => {
    setSelectedClient(null)
    setMode('create')
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setMode('edit')
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedClient(null)
  }

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch(
        selectedClient ? `/api/clients/${selectedClient.id}` : '/api/clients',
        {
          method: selectedClient ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'クライアントの保存に失敗しました')
      }

      // 成功したら一覧に戻る
      setMode('list')
      setSelectedClient(null)

      // ページをリロードして最新のデータを表示
      window.location.reload()
    } catch (error) {
      throw error
    }
  }

  const handleDelete = (clientId: string) => {
    // 削除成功時の処理（必要に応じて）
    console.log('クライアント削除:', clientId)
  }

  return (
    <div className="space-y-6">
      {mode === 'list' ? (
        <ClientList onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <ClientForm
          client={selectedClient}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
