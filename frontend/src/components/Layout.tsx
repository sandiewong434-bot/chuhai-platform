import { Outlet, NavLink, useLocation } from 'react-router-dom'
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
  Search,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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

// 面包屑映射
const breadcrumbMap: Record<string, string> = {
  '/': '仪表盘',
  '/industry': '产业链全景',
  '/export': '出口分析',
  '/scores': '国别评估',
  '/barriers': '贸易壁垒',
  '/enterprises': '企业追踪',
  '/articles': '文章检索',
  '/ontology': '本体图谱',
  '/sources': '信源监控',
}

// 模拟数据更新 hook
function useDataStatus() {
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [sourceHealth] = useState({ total: 87, online: 82, offline: 5 })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsRefreshing(false)
    }, 1200)
  }

  // 每 30 秒自动更新时间显示（实际刷新由后端调度）
  useEffect(() => {
    const timer = setInterval(() => setLastUpdate(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  return { lastUpdate, sourceHealth, isRefreshing, refresh }
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const { lastUpdate, sourceHealth, isRefreshing, refresh } = useDataStatus()

  const healthRate = Math.round((sourceHealth.online / sourceHealth.total) * 100)
  const healthColor =
    healthRate >= 90 ? 'text-green-600 bg-green-50' :
    healthRate >= 70 ? 'text-yellow-600 bg-yellow-50' :
    'text-red-600 bg-red-50'

  // 模拟通知
  const notifications = [
    { id: 1, type: 'alert', title: '3 个信源异常', time: '5分钟前', read: false },
    { id: 2, type: 'info', title: '今日新增文章 128 篇', time: '15分钟前', read: false },
    { id: 3, type: 'success', title: '欧盟反补贴税数据已更新', time: '1小时前', read: true },
  ]
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 侧边栏 ── */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">出海平台</h1>
              <p className="text-[10px] text-gray-400 leading-tight">NEV 出海智能决策</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 侧边栏底部 · 版本信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>v1.0.0-beta</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              运行中
            </span>
          </div>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ═══════════════════════════════════════════════════ */}
        {/* 顶部状态栏 · 升级                                   */}
        {/* ═══════════════════════════════════════════════════ */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4">
          {/* 左侧：面包屑 + 菜单按钮 */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-gray-500">
              <span className="text-gray-400">首页</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-gray-300" />
              <span className="font-medium text-gray-900 truncate">
                {breadcrumbMap[location.pathname] || '页面'}
              </span>
            </div>
          </div>

          {/* 中间：全局搜索框 */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文章、企业、政策..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/articles?q=${encodeURIComponent(searchQuery)}`
                  }
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* 右侧：状态指示器 */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* 信源健康度 */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${healthColor}`}>
              {healthRate >= 90 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>信源 {healthRate}%</span>
            </div>

            {/* 数据更新时间 */}
            <button
              onClick={refresh}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              title="点击刷新"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              <Clock className="w-3.5 h-3.5" />
              <span>
                {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>

            {/* 通知铃铛 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 通知下拉 */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">通知</h3>
                      <span className="text-xs text-gray-400">{unreadCount} 条未读</span>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0',
                            !n.read && 'bg-blue-50/50'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                              n.type === 'alert' ? 'bg-red-400' :
                              n.type === 'success' ? 'bg-green-400' :
                              'bg-blue-400'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm', !n.read ? 'font-medium text-gray-900' : 'text-gray-600')}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── 页面内容 ── */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
