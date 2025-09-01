import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default async function Login() {
  const supabase = createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // ロールに応じて既ログイン時の着地点を変更
    const { data: current } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if ((current as any)?.role === 'superadmin') {
      redirect('/super-admin')
    } else {
      redirect('/projects')
    }
  }

  return <AuthForm />
}
