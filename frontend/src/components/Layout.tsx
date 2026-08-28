import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Network,
  Globe,
  ShieldAlert,
  Building2,
  Radio,
  Menu,
  X,
  Factory,
  Ship,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/industry', label: '产业链全景', icon: Factory },
  { path: '/export', label: '出口分析', icon: Ship },
  { path: '/scores', label: '国别评估', icon: Globe },
  { path: '/barriers', label: '贸易壁垒', icon: ShieldAlert },
  { path: '/enterprises', label: '企业追踪', icon: Building2 },
  { path: '/articles', label: '文章检索', icon: FileText },
  { path: '/ontology', label: '本体图谱', icon: Network },
  { path: '/sources', label: '信源监控', icon: Radio },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">出海平台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-auto text-sm text-gray-500">
            新能源汽车出海智能决策BI看板 v1.0
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
