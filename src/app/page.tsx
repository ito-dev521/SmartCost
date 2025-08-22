import { createServerComponentClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Building2,
  Calculator,
  DollarSign,
  BarChart3,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const supabase = createServerComponentClient()

  const { data: { session } } = await supabase.auth.getSession()

  // ログイン済みの場合はダッシュボードにリダイレクト
  if (session) {
    redirect('/dashboard')
  }

  // 未ログインの場合はホームページを表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SmartCost</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                無料で始める
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインヒーローセクション */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              建設原価管理を
              <span className="text-blue-600">スマートに</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              クラウドベースの原価管理システムで、建設プロジェクトの収益性を最大化。
              リアルタイムのコスト管理と分析で、ビジネスを次のレベルへ。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                今すぐ始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        </div>

        {/* 特徴セクション */}
        <div id="features" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                主な機能
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                建設プロジェクトの管理に必要なすべての機能を網羅
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* プロジェクト管理 */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">プロジェクト管理</h3>
                <p className="text-gray-600">
                  プロジェクトの作成・編集・削除、進捗管理、ステータス管理
                </p>
              </div>

              {/* 原価入力 */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">原価入力</h3>
                <p className="text-gray-600">
                  リアルタイムのコスト入力、予算管理、コスト分析
                </p>
              </div>

              {/* 資金管理 */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">資金管理</h3>
                <p className="text-gray-600">
                  キャッシュフロー予測、支払いスケジュール管理
                </p>
              </div>

              {/* 分析・レポート */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">分析・レポート</h3>
                <p className="text-gray-600">
                  詳細なコスト分析、レポート生成、データ可視化
                </p>
              </div>

              {/* ユーザー管理 */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">ユーザー管理</h3>
                <p className="text-gray-600">
                  ユーザー追加・編集、権限設定、ロール管理
                </p>
              </div>

              {/* 工事進行基準 */}
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">工事進行基準</h3>
                <p className="text-gray-600">
                  進捗管理、収益認識、工事損益計算
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 導入メリット */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                導入メリット
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                SmartCost導入で得られる主なメリット
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">業務効率化</h3>
                <p className="text-gray-600">
                  手作業によるコスト管理から自動化システムへ。時間と労力を大幅に削減。
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">収益性向上</h3>
                <p className="text-gray-600">
                  リアルタイムのコスト分析で、プロジェクトの収益性を最大化。
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">セキュリティ</h3>
                <p className="text-gray-600">
                  クラウドベースの安全なデータ管理で、重要な情報を保護。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAセクション */}
        <div className="bg-blue-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              今すぐSmartCostを始めましょう
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              無料トライアルで、建設原価管理の新しい時代を体験してください。
            </p>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">SmartCost</span>
              </div>
              <p className="text-gray-400">
                建設業界向けクラウド原価管理システム
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">機能</h3>
              <ul className="space-y-2 text-gray-400">
                <li>プロジェクト管理</li>
                <li>原価入力</li>
                <li>分析・レポート</li>
                <li>資金管理</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li>ヘルプセンター</li>
                <li>お問い合わせ</li>
                <li>ドキュメント</li>
                <li>FAQ</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">会社情報</h3>
              <ul className="space-y-2 text-gray-400">
                <li>会社概要</li>
                <li>プライバシーポリシー</li>
                <li>利用規約</li>
                <li>お知らせ</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartCost. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
