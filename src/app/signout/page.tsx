'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'

export default function SignoutPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleSignout = async () => {
      try {
        await supabase.auth.signOut()
        router.replace('/login')
      } catch (error) {
        console.error('❌ SignoutPage: ログアウトエラー:', error)
        router.replace('/login')
      }
    }

    handleSignout()
  }, [supabase.auth, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">サインアウト中...</p>
      </div>
    </div>
  )
}
