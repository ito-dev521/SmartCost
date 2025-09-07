'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'

declare global {
  interface Window {
    supabase: any
  }
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    window.supabase = supabase
  }, [])

  return <>{children}</>
}
