import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Network, Globe, ShieldAlert,
  Building2, Radio, Menu, X, Factory, Ship, Search, Bell,
  RefreshCw, Wifi, WifiOff, Clock, ChevronRight, Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: '决策总览',
    items: [
      { path: '/', label: '智能指挥中心', icon: LayoutDashboard },
    ]
  },
  {
    label: '数据底座',
    items: [
      { path: '/industry', label: '产业链全景', icon: Factory },
      { path: '/export', label: '出口分析', icon: Ship },
      { path: '/market', label: '全球市场', icon: Globe },
    ]
  },
  {
    label: '出海现状',
    items: [
      { path: '/scores', label: '国别评估', icon: Globe },
      { path: '/barriers', label: '贸易壁垒', icon: ShieldAlert },
      { path: '/enterprises', label: '企业追踪', icon: Building2 },
    ]
  },
  {
    label: '知识图谱',
    items: [
      { path: '/articles', label: '文章检索', icon: FileText },
      { path: '/ontology', label: '本体图谱', icon: Network },
      { path: '/sources', label: '信源监控', icon: Radio },
    ]
  },
]

const breadcrumbMap: Record<string, string> = {
  '/': '智能指挥中心',
  '/industry': '产业链全景',
  '/export': '出口分析',
  '/scores': '国别评估',
  '/barriers': '贸易壁垒',
  '/enterprises': '企业追踪',
  '/articles': '文章检索',
  '/ontology': '本体图谱',
  '/sources': '信源监控',
  '/market': '全球市场',
}

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

  const notifications = [
    { id: 1, type: 'alert', title: '3 个信源异常', time: '5分钟前', read: false },
    { id: 2, type: 'info', title: '今日新增文章 128 篇', time: '15分钟前', read: false },
    { id: 3, type: 'success', title: '欧盟反补贴税数据已更新', time: '1小时前', read: true },
  ]
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex h-screen bg-[#06111e]">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 侧边栏 ── */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform lg:transform-none',
          'bg-[#0a1a2b] border-r border-[rgba(96,178,216,0.12)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(96,178,216,0.12)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--cyan)]">
              <Sparkles className="w-4 h-4 text-[var(--cyan)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">出海平台</h1>
              <p className="text-[10px] text-[var(--muted-text)] leading-tight tracking-wider">NEV GLOBAL COMMAND</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-white/5"
          >
            <X className="w-5 h-5 text-[var(--muted-text)]" />
          </button>
        </div>

        {/* 导航 */}
        <nav className="p-3 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[1.5px] uppercase text-[var(--muted-text)]">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)] border border-[rgba(0,194,255,0.2)]'
                          : 'text-[var(--muted-text)] hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[rgba(96,178,216,0.08)]">
          <div className="flex items-center justify-between text-xs text-[var(--muted-text)]">
            <span>v1.0.0-beta</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" style={{ boxShadow: '0 0 6px var(--teal)' }} />
              运行中
            </span>
          </div>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-[#0a1a2b]/80 backdrop-blur-md border-b border-[rgba(96,178,216,0.12)] flex items-center justify-between px-4 lg:px-6 gap-4 sticky top-0 z-30">
          {/* 左侧：面包屑 + 菜单按钮 */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5 text-[var(--muted-text)]" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-[var(--muted-text)]">
              <span>首页</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1" />
              <span className="font-medium text-white truncate">
                {breadcrumbMap[location.pathname] || '页面'}
              </span>
            </div>
          </div>

          {/* 中间：全局搜索框 */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-text)]" />
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
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg
                  bg-[rgba(0,194,255,0.06)] border border-[rgba(96,178,216,0.15)]
                  text-white placeholder:text-[var(--muted-text)]
                  focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/20
                  transition-all"
              />
            </div>
          </div>

          {/* 右侧：状态指示器 */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* 信源健康度 */}
            <div className={cn(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border',
              healthRate >= 90 
                ? 'text-[var(--teal)] border-[var(--teal)]/20 bg-[var(--teal)]/10'
                : healthRate >= 70
                  ? 'text-[var(--amber)] border-[var(--amber)]/20 bg-[var(--amber)]/10'
                  : 'text-[var(--danger)] border-[var(--danger)]/20 bg-[var(--danger)]/10'
            )}>
              {healthRate >= 90 ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>信源 {healthRate}%</span>
            </div>

            {/* 数据更新时间 */}
            <button
              onClick={refresh}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-text)] hover:bg-white/5 transition-colors border border-transparent hover:border-[rgba(96,178,216,0.15)]"
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
                className="p-2 rounded-lg hover:bg-white/5 transition-colors relative border border-transparent hover:border-[rgba(96,178,216,0.15)]"
              >
                <Bell className="w-5 h-5 text-[var(--muted-text)]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[rgba(96,178,216,0.15)] shadow-2xl z-50 overflow-hidden"
                    style={{ background: '#0d2438' }}>
                    <div className="px-4 py-3 border-b border-[rgba(96,178,216,0.1)] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">通知</h3>
                      <span className="text-xs text-[var(--muted-text)]">{unreadCount} 条未读</span>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-[rgba(96,178,216,0.06)] last:border-0',
                            !n.read && 'bg-[rgba(0,194,255,0.06)]'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                              n.type === 'alert' ? 'bg-[var(--danger)]' :
                              n.type === 'success' ? 'bg-[var(--teal)]' :
                              'bg-[var(--cyan)]'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm', !n.read ? 'font-medium text-white' : 'text-[var(--muted-text)]')}>
                                {n.title}
                              </p>
                              <p className="text-xs text-[var(--muted-text)] mt-0.5">{n.time}</p>
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
