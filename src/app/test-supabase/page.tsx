import { createClientComponentClient } from '@/lib/supabase'

export default function TestSupabasePage() {
  const testConnection = async () => {
    try {
      const supabase = createClientComponentClient()
      
      // 基本的な接続テスト
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Supabase接続エラー:', error)
        alert(`接続エラー: ${error.message}`)
      } else {
        console.log('Supabase接続成功:', data)
        alert('Supabase接続成功！')
      }
    } catch (err) {
      console.error('予期しないエラー:', err)
      alert(`予期しないエラー: ${err}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase接続テスト</h1>
      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        接続テスト
      </button>
    </div>
  )
}
