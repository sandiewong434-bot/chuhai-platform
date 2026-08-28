import { Link } from 'react-router-dom'
import {
  Factory,
  Ship,
  Globe,
  ShieldAlert,
  Building2,
  FileText,
  Network,
  Radio,
  TrendingUp,
  AlertTriangle,
  Zap,
  ArrowRight,
  BarChart3,
  Calculator,
  Wrench,
  Car,
} from 'lucide-react'

// 十大模块定义
const modules = [
  {
    id: 'M1',
    title: '产业链全景',
    desc: '锂矿→材料→电池→整车→设施全链路',
    icon: Factory,
    path: '/industry',
    status: 'online',
    phase: 'P0',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    id: 'M2',
    title: '全球市场洞察',
    desc: '全球空间、竞争格局、关税壁垒',
    icon: Globe,
    path: '/scores',
    status: 'partial',
    phase: 'P1',
    color: 'bg-gray-50 border-gray-200 hover:border-gray-400',
    iconColor: 'text-gray-500',
  },
  {
    id: 'M3',
    title: '出口分析',
    desc: '规模、结构、国别、品牌、模式七维分析',
    icon: Ship,
    path: '/export',
    status: 'online',
    phase: 'P0',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    id: 'M4',
    title: '对外投资分析',
    desc: '资金流向、区域布局、产业链环节',
    icon: TrendingUp,
    path: '#',
    status: 'coming',
    phase: 'P1',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
  {
    id: 'M5',
    title: '技术授权与合作',
    desc: '技术输出规模、模式、合作网络',
    icon: Wrench,
    path: '#',
    status: 'coming',
    phase: 'P2',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
  {
    id: 'M6',
    title: '企业内功诊断',
    desc: '五项内功雷达图 + 出海路径适配',
    icon: BarChart3,
    path: '/enterprises',
    status: 'partial',
    phase: 'P2',
    color: 'bg-gray-50 border-gray-200 hover:border-gray-400',
    iconColor: 'text-gray-500',
  },
  {
    id: 'M7',
    title: '目标市场筛选',
    desc: '先锋/主力/潜力三级梯队推荐',
    icon: Globe,
    path: '/scores',
    status: 'partial',
    phase: 'P0',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    id: 'M8',
    title: '进入模式测算',
    desc: '模式对比、成本测算、回本周期',
    icon: Calculator,
    path: '#',
    status: 'coming',
    phase: 'P1',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
  {
    id: 'M9',
    title: '风险监控预警',
    desc: '实时风险驾驶舱、热力地图、红绿灯',
    icon: ShieldAlert,
    path: '/barriers',
    status: 'partial',
    phase: 'P0',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
  },
  {
    id: 'M10',
    title: '产品选品分析',
    desc: '车型TOP10、竞品对比、选品建议',
    icon: Car,
    path: '#',
    status: 'coming',
    phase: 'P1',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-400',
  },
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

export default function Dashboard() {
  const onlineModules = modules.filter(m => m.status === 'online')
  const partialModules = modules.filter(m => m.status === 'partial')
  const comingModules = modules.filter(m => m.status === 'coming')

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          新能源汽车出海智能决策 BI 看板
        </h2>
        <p className="text-gray-500 mt-1">
          十大模块 · 数据驱动出海决策
        </p>
      </div>

      {/* 核心KPI横幅 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* 模块导航网格 */}
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

      {/* 快速入口 · 原有功能 */}
      <div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">建设进度</h3>
        <div className="space-y-4">
          {[
            { phase: 'P0 · 第一期（0-3个月）', modules: 'M1产业链 / M3出口 / M7目标市场 / M9风险预警', progress: 45, color: 'bg-blue-600' },
            { phase: 'P1 · 第二期（3-6个月）', modules: 'M2全球市场 / M4对外投资 / M8模式测算 / M10产品选品', progress: 0, color: 'bg-gray-300' },
            { phase: 'P2 · 第三期（6-12个月）', modules: 'M5技术授权 / M6内功诊断', progress: 0, color: 'bg-gray-300' },
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
  )
}
