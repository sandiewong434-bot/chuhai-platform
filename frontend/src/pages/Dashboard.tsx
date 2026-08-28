import { Link } from 'react-router-dom'
import {
  Factory, Ship, Globe, ShieldAlert, Building2, FileText,
  Network, Radio, TrendingUp, AlertTriangle, Zap,
  ArrowRight, BarChart3, Calculator, Wrench, Car,
  Activity, Bell, Newspaper, TrendingDown, AlertCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════
// 模块定义
// ═══════════════════════════════════════════════════════════════
const modules = [
  { id: 'M1', title: '产业链全景', desc: '锂矿→材料→电池→整车→设施全链路', icon: Factory, path: '/industry', status: 'online', phase: 'P0', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', iconColor: 'text-blue-600' },
  { id: 'M2', title: '全球市场洞察', desc: '全球空间、竞争格局、关税壁垒', icon: Globe, path: '/scores', status: 'partial', phase: 'P1', color: 'bg-gray-50 border-gray-200 hover:border-gray-400', iconColor: 'text-gray-500' },
  { id: 'M3', title: '出口分析', desc: '规模、结构、国别、品牌、模式七维分析', icon: Ship, path: '/export', status: 'online', phase: 'P0', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', iconColor: 'text-blue-600' },
  { id: 'M4', title: '对外投资分析', desc: '资金流向、区域布局、产业链环节', icon: TrendingUp, path: '#', status: 'coming', phase: 'P1', color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-400' },
  { id: 'M5', title: '技术授权与合作', desc: '技术输出规模、模式、合作网络', icon: Wrench, path: '#', status: 'coming', phase: 'P2', color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-400' },
  { id: 'M6', title: '企业内功诊断', desc: '五项内功雷达图 + 出海路径适配', icon: BarChart3, path: '/enterprises', status: 'partial', phase: 'P2', color: 'bg-gray-50 border-gray-200 hover:border-gray-400', iconColor: 'text-gray-500' },
  { id: 'M7', title: '目标市场筛选', desc: '先锋/主力/潜力三级梯队推荐', icon: Globe, path: '/scores', status: 'partial', phase: 'P0', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', iconColor: 'text-blue-600' },
  { id: 'M8', title: '进入模式测算', desc: '模式对比、成本测算、回本周期', icon: Calculator, path: '#', status: 'coming', phase: 'P1', color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-400' },
  { id: 'M9', title: '风险监控预警', desc: '实时风险驾驶舱、热力地图、红绿灯', icon: ShieldAlert, path: '/barriers', status: 'partial', phase: 'P0', color: 'bg-blue-50 border-blue-200 hover:border-blue-400', iconColor: 'text-blue-600' },
  { id: 'M10', title: '产品选品分析', desc: '车型TOP10、竞品对比、选品建议', icon: Car, path: '#', status: 'coming', phase: 'P1', color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-400' },
]

const statusLabel: Record<string, { text: string; class: string }> = {
  online: { text: '已上线', class: 'bg-green-100 text-green-700' },
  partial: { text: '基础版', class: 'bg-blue-100 text-blue-700' },
  coming: { text: '待上线', class: 'bg-gray-100 text-gray-500' },
}

const phaseLabel: Record<string, string> = {
  P0: '第一期（0-3月）',
  P1: '第二期（3-6月）',
  P2: '第三期（6-12月）',
}

// ═══════════════════════════════════════════════════════════════
// 图表数据
// ═══════════════════════════════════════════════════════════════
const exportTrend = [
  { month: '1月', export: 58.3, penetration: 38.2 },
  { month: '2月', export: 37.7, penetration: 35.1 },
  { month: '3月', export: 58.2, penetration: 39.5 },
  { month: '4月', export: 59.4, penetration: 40.1 },
  { month: '5月', export: 62.5, penetration: 42.3 },
  { month: '6月', export: 58.7, penetration: 41.8 },
]

const sourceHealth = [
  { name: '正常', value: 82, color: '#22c55e' },
  { name: '异常', value: 5, color: '#ef4444' },
  { name: '未启动', value: 8, color: '#9ca3af' },
]

const countryRisk = [
  { country: '欧盟', level: '高', cases: 3, trend: 'up', color: '#ef4444' },
  { country: '美国', level: '高', cases: 2, trend: 'up', color: '#ef4444' },
  { country: '土耳其', level: '中', cases: 1, trend: 'flat', color: '#f59e0b' },
  { country: '印度', level: '中', cases: 1, trend: 'up', color: '#f59e0b' },
  { country: '俄罗斯', level: '低', cases: 0, trend: 'down', color: '#22c55e' },
  { country: '泰国', level: '低', cases: 0, trend: 'flat', color: '#22c55e' },
]

const latestNews = [
  { time: '10分钟前', type: 'risk', title: '欧盟对华电动汽车反补贴税正式生效，税率17-35.3%', urgent: true },
  { time: '32分钟前', type: 'data', title: '6月NEV出口58.7万辆，渗透率41.8%创历史新高', urgent: false },
  { time: '1小时前', type: 'policy', title: '美国宣布对华301关税上调，电动汽车关税提至100%', urgent: true },
  { time: '2小时前', type: 'enterprise', title: '比亚迪泰国工厂正式投产，年产能15万辆', urgent: false },
  { time: '3小时前', type: 'data', title: '宁德时代发布2026H1财报：海外营收同比+67%', urgent: false },
]

// ═══════════════════════════════════════════════════════════════
// 组件主体
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const onlineModules = modules.filter(m => m.status === 'online')
  const partialModules = modules.filter(m => m.status === 'partial')
  const comingModules = modules.filter(m => m.status === 'coming')

  return (
    <div className="space-y-8">
      {/* ── 页面标题 ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          新能源汽车出海智能决策 BI 看板
        </h2>
        <p className="text-gray-500 mt-1">
          十大模块 · 数据驱动出海决策
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第一行：核心 KPI + 趋势图                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI 卡片 */}
        <div className="lg:col-span-1 space-y-3">
          {[
            { label: '全球NEV销量(2026H1)', value: '1090万辆', change: '+23%', icon: Globe, color: 'bg-blue-50 text-blue-700' },
            { label: '中国NEV出口(H1)', value: '293万辆', change: '+25.3%', icon: Ship, color: 'bg-green-50 text-green-700' },
            { label: '覆盖国家/地区', value: '20+', change: '评分中', icon: Zap, color: 'bg-purple-50 text-purple-700' },
            { label: '风险预警事件', value: '6', sub: '高风险', icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.change && (
                  <span className="text-xs font-medium text-green-600">{kpi.change}</span>
                )}
                {kpi.sub && (
                  <span className="text-xs font-medium text-red-600">{kpi.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 趋势图 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">出口量与渗透率趋势（2026上半年）</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                出口量(万辆)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                渗透率(%)
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={exportTrend}>
              <defs>
                <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" domain={[30, 50]} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="export" name="出口量" stroke="#3b82f6" fill="url(#exportGrad)" strokeWidth={2} />
              <Area yAxisId="right" type="monotone" dataKey="penetration" name="渗透率" stroke="#22c55e" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第二行：信源健康度 + 风险地图 + 最新动态                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 信源健康度 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">信源健康度</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={sourceHealth}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }: any) => `${name}:${value}`}
              >
                {sourceHealth.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {sourceHealth.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-gray-600">{s.name}</span>
                <span className="font-medium text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>
          <Link to="/sources" className="flex items-center justify-center gap-1 mt-4 text-xs text-blue-600 hover:text-blue-700">
            查看详情 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 国别风险概览 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-base font-semibold text-gray-900">国别风险概览</h3>
          </div>
          <div className="space-y-3">
            {countryRisk.map((c) => (
              <div key={c.country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm text-gray-700">{c.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.color + '20', color: c.color }}>
                    {c.level}风险
                  </span>
                  {c.cases > 0 && (
                    <span className="text-xs text-red-600 font-medium">{c.cases}起案件</span>
                  )}
                  {c.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                  {c.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                  {c.trend === 'flat' && <span className="w-3.5 h-3.5 text-gray-400">→</span>}
                </div>
              </div>
            ))}
          </div>
          <Link to="/barriers" className="flex items-center justify-center gap-1 mt-4 text-xs text-blue-600 hover:text-blue-700">
            查看贸易壁垒详情 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 最新动态 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-semibold text-gray-900">最新动态</h3>
            </div>
            <span className="text-xs text-gray-400">{latestNews.filter(n => n.urgent).length} 条紧急</span>
          </div>
          <div className="space-y-3">
            {latestNews.map((news, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg ${news.urgent ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                <div className="flex items-start gap-2">
                  {news.type === 'risk' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
                  {news.type === 'data' && <BarChart3 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />}
                  {news.type === 'policy' && <Newspaper className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />}
                  {news.type === 'enterprise' && <Building2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${news.urgent ? 'font-medium text-red-800' : 'text-gray-700'}`}>
                      {news.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{news.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/articles" className="flex items-center justify-center gap-1 mt-4 text-xs text-blue-600 hover:text-blue-700">
            查看全部文章 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第三行：模块导航                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">十大功能模块</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              已上线 {onlineModules.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              基础版 {partialModules.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              待上线 {comingModules.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {modules.map((mod) => {
            const isComing = mod.status === 'coming'
            return (
              <Link
                key={mod.id}
                to={isComing ? '#' : mod.path}
                onClick={isComing ? (e) => e.preventDefault() : undefined}
                className={`relative p-4 rounded-lg border transition-all ${
                  isComing ? 'opacity-60 cursor-not-allowed' : mod.color + ' hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${mod.color}`}>
                    <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabel[mod.status].class}`}>
                    {statusLabel[mod.status].text}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mt-3">{mod.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mod.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{mod.id} · {phaseLabel[mod.phase]}</span>
                  {!isComing && <ArrowRight className="w-4 h-4 text-gray-400" />}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第四行：数据底座 + 建设进度                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 数据底座 */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">数据底座</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '文章检索', desc: '全文搜索与多维筛选', to: '/articles', icon: FileText },
              { label: '本体图谱', desc: '企业与关系网络可视化', to: '/ontology', icon: Network },
              { label: '信源监控', desc: '健康度与运行日志', to: '/sources', icon: Radio },
              { label: '企业追踪', desc: '出海动态与投资建厂', to: '/enterprises', icon: Building2 },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>

        {/* 建设进度 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">建设进度</h3>
          <div className="space-y-4">
            {[
              { phase: 'P0 · 第一期', modules: 'M1产业链 / M3出口 / M7目标市场 / M9风险', progress: 60, color: 'bg-blue-600' },
              { phase: 'P1 · 第二期', modules: 'M2全球市场 / M4对外投资 / M8模式测算 / M10产品', progress: 10, color: 'bg-amber-500' },
              { phase: 'P2 · 第三期', modules: 'M5技术授权 / M6内功诊断', progress: 0, color: 'bg-gray-300' },
            ].map((item) => (
              <div key={item.phase}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.phase}</span>
                  <span className="text-sm text-gray-500">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{item.modules}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 数据来源说明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">数据说明</p>
          <p className="text-sm text-amber-700 mt-1">
            当前仪表盘展示为演示数据。正式版本将接入实时数据API，实现自动刷新与告警推送。
          </p>
        </div>
      </div>
    </div>
  )
}
