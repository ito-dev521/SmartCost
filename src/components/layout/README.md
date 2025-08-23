# Layout Components

このディレクトリには、アプリケーション全体で使用するレイアウト関連のコンポーネントが含まれています。

## SidebarNavigation

再利用可能なサイドナビゲーションコンポーネントです。

### 使用方法

```tsx
import SidebarNavigation from '@/components/layout/SidebarNavigation'

// デフォルト設定で使用
<SidebarNavigation />

// カスタム設定で使用
<SidebarNavigation
  title="マイナビゲーション"
  currentPath="/current-path"
  navigationItems={[
    { href: '/home', label: 'ホーム', icon: Home },
    { href: '/about', label: '概要', icon: Info },
  ]}
/>
```

### Props

| プロパティ | 型 | デフォルト | 説明 |
|------------|----|------------|------|
| `title` | `string` | `'ナビゲーション'` | ナビゲーションのタイトル |
| `navigationItems` | `NavigationItem[]` | デフォルト項目 | ナビゲーション項目の配列 |
| `currentPath` | `string` | - | 現在のページパス（アクティブ表示用） |

### NavigationItem インターフェース

```tsx
interface NavigationItem {
  href: string          // リンク先URL
  label: string         // 表示テキスト
  icon?: React.ComponentType<{ className?: string }>  // アイコンコンポーネント
}
```

### 特徴

- ✅ アクティブページのハイライト表示
- ✅ カスタマイズ可能なナビゲーション項目
- ✅ 適切なアイコン割り当て
- ✅ レスポンシブデザイン対応
- ✅ TypeScript 完全対応

### デフォルトのナビゲーション項目

コンポーネントは以下のページへのリンクを含むデフォルト設定を提供します：

- ダッシュボード (`/dashboard`) - Home アイコン
- プロジェクト管理 (`/projects`) - Building2 アイコン
- 原価入力 (`/cost-entry`) - Calculator アイコン
- 作業日報 (`/daily-report`) - ClipboardList アイコン
- 分析・レポート (`/analytics`) - BarChart3 アイコン
- 資金管理 (`/cash-flow`) - DollarSign アイコン
- 工事進行基準 (`/progress`) - TrendingUp アイコン
- クライアント管理 (`/clients`) - Building2 アイコン
- ユーザー管理 (`/users`) - Users アイコン
- 管理者パネル (`/admin`) - Settings アイコン
- スーパー管理者パネル (`/super-admin`) - Shield アイコン

### 使用例

#### 作業日報ページ
```tsx
import SidebarNavigation from '@/components/layout/SidebarNavigation'
import { usePathname } from 'next/navigation'

export default function DailyReportPage() {
  const pathname = usePathname()

  return (
    <div className="flex">
      <SidebarNavigation
        title="作業日報メニュー"
        currentPath={pathname}
      />
      {/* メインコンテンツ */}
    </div>
  )
}
```

#### カスタムナビゲーション
```tsx
const customItems = [
  { href: '/reports', label: 'レポート', icon: FileText },
  { href: '/settings', label: '設定', icon: Settings },
]

<SidebarNavigation
  title="レポートメニュー"
  navigationItems={customItems}
  currentPath="/reports"
/>
```

