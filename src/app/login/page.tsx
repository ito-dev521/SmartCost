import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default async function Login() {
  const supabase = createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/projects')
  }

  return <AuthForm />
}
