import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, AlertTriangle, ShieldAlert, Globe, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { barrierApi } from '@/lib/api'

interface BarrierCase {
  id: number
  title: string
  country: string
  type: string
  status: string
  date: string | null
  nev_related: boolean
  description: string
  source_name: string
  url: string
}

interface BarrierListData {
  total: number
  items: BarrierCase[]
  page: number
  size: number
}

type RiskTab = 'overview' | 'barriers' | 'policy' | 'supply'
type RiskLevel = 'high' | 'medium' | 'low'

// 风险事件模拟数据
const riskEvents = [
  { id: 1, title: '欧盟对中国电动车加征临时反补贴税', country: '欧盟', level: 'high' as RiskLevel, date: '2026-08-20', category: '关税', nev: true },
  { id: 2, title: '美国对华301关税复审', country: '美国', level: 'high' as RiskLevel, date: '2026-08-18', category: '关税', nev: true },
  { id: 3, title: '土耳其对华电动车加征40%附加关税', country: '土耳其', level: 'medium' as RiskLevel, date: '2026-08-15', category: '关税', nev: true },
  { id: 4, title: '巴西结束电动车进口免税', country: '巴西', level: 'medium' as RiskLevel, date: '2026-07-01', category: '政策', nev: true },
  { id: 5, title: '印度对中国钢铁产品反倾销调查', country: '印度', level: 'low' as RiskLevel, date: '2026-08-10', category: '反倾销', nev: false },
  { id: 6, title: '俄罗斯简化中国汽车进口程序', country: '俄罗斯', level: 'low' as RiskLevel, date: '2026-08-05', category: '政策', nev: true },
  { id: 7, title: '加拿大启动中国电动车补贴调查', country: '加拿大', level: 'high' as RiskLevel, date: '2026-08-12', category: '反补贴', nev: true },
  { id: 8, title: '印尼新能源汽车进口关税调整', country: '印尼', level: 'medium' as RiskLevel, date: '2026-08-08', category: '关税', nev: true },
]

// 国别风险热力数据
const countryRiskHeat = [
  { country: '美国', level: 'high', score: 85, events: 3 },
  { country: '欧盟', level: 'high', score: 82, events: 2 },
  { country: '加拿大', level: 'high', score: 78, events: 1 },
  { country: '土耳其', level: 'medium', score: 65, events: 1 },
  { country: '巴西', level: 'medium', score: 58, events: 1 },
  { country: '印尼', level: 'medium', score: 55, events: 1 },
  { country: '印度', level: 'low', score: 42, events: 1 },
  { country: '俄罗斯', level: 'low', score: 35, events: 1 },
  { country: '泰国', level: 'low', score: 28, events: 0 },
  { country: '墨西哥', level: 'low', score: 32, events: 0 },
  { country: '越南', level: 'low', score: 25, events: 0 },
  { country: '匈牙利', level: 'low', score: 22, events: 0 },
]

const levelConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  high: { label: '高风险', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  medium: { label: '需关注', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: ShieldAlert },
  low: { label: '正常', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: Minus },
}

export default function TradeBarrier() {
  const [activeTab, setActiveTab] = useState<RiskTab>('overview')
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [onlyNEV, setOnlyNEV] = useState(false)

  const { data, isLoading } = useQuery<BarrierListData>({
    queryKey: ['barriers', q, typeFilter, onlyNEV],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (q) params.q = q
      if (typeFilter) params.barrier_type = typeFilter
      if (onlyNEV) params.only_nev = true
      const res = await barrierApi.list(params)
      return res.data
    },
  })

  const filtered = data?.items || []

  const highRisks = riskEvents.filter((e) => e.level === 'high')
  const mediumRisks = riskEvents.filter((e) => e.level === 'medium')
  const lowRisks = riskEvents.filter((e) => e.level === 'low')
  const nevRisks = riskEvents.filter((e) => e.nev)

  const tabs: { key: RiskTab; label: string }[] = [
    { key: 'overview', label: '实时风险总览' },
    { key: 'barriers', label: '关税与贸易政策' },
    { key: 'policy', label: '合规与投资审查' },
    { key: 'supply', label: '供应链风险' },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">风险监控与动态预警</h2>
        <p className="text-gray-500 mt-1">实时风险驾驶舱 · 关税壁垒 · 地缘政策 · 供应链监控</p>
      </div>

      {/* 风险分级统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '高风险事件', value: highRisks.length, sub: '需立即关注', color: 'bg-red-50 text-red-700', icon: AlertTriangle },
          { label: '需关注事件', value: mediumRisks.length, sub: '持续跟踪', color: 'bg-yellow-50 text-yellow-700', icon: ShieldAlert },
          { label: '正常/利好', value: lowRisks.length, sub: '常规监控', color: 'bg-green-50 text-green-700', icon: Minus },
          { label: 'NEV相关', value: nevRisks.length, sub: '直接影响', color: 'bg-blue-50 text-blue-700', icon: Globe },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <span className="text-xs text-gray-500">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ① 实时风险总览 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 国别风险热力 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">国别风险热力</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {countryRiskHeat.map((c) => {
                const cfg = c.level === 'high' ? levelConfig.high : c.level === 'medium' ? levelConfig.medium : levelConfig.low
                return (
                  <div key={c.country} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border} transition-all hover:shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{c.country}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{c.score}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-500">{c.events}起事件</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${c.score >= 70 ? 'bg-red-500' : c.score >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 最新风险事件 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最新风险事件</h3>
            <div className="space-y-3">
              {riskEvents.slice(0, 6).map((event) => {
                const cfg = levelConfig[event.level]
                return (
                  <div key={event.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                    <cfg.icon className={`w-5 h-5 mt-0.5 ${cfg.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{event.title}</span>
                        {event.nev && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            NEV
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {event.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.date}
                        </span>
                        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ② 关税与贸易政策 */}
      {activeTab === 'barriers' && (
        <div className="space-y-4">
          {/* 筛选 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索案件或国家..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <button
                onClick={() => { setQ(''); setTypeFilter(''); setOnlyNEV(false) }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                重置
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">全部类型</option>
                <option value="反倾销调查">反倾销调查</option>
                <option value="反补贴调查">反补贴调查</option>
                <option value="关税措施">关税措施</option>
                <option value="贸易壁垒">贸易壁垒</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={onlyNEV}
                  onChange={(e) => setOnlyNEV(e.target.checked)}
                  className="rounded"
                />
                仅 NEV 相关
              </label>
            </div>
          </div>

          {/* 案件列表 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无数据</div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-lg border p-5 ${
                    c.nev_related ? 'border-red-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{c.title}</h3>
                        {c.nev_related && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            NEV
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{c.country}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c.type}</span>
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded">{c.status}</span>
                        <span className="text-gray-400">{c.date || '日期未知'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ③ 合规与投资审查 */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">合规与投资审查风险</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { title: '美国CFIUS审查', desc: '外国投资委员会对中国车企赴美投资的审查趋严', level: 'high' as RiskLevel, date: '2026-08-18' },
                { title: '欧盟外国补贴条例', desc: '对获得政府补贴的企业在欧盟并购/投标进行审查', level: 'high' as RiskLevel, date: '2026-08-15' },
                { title: '印度FDI政策', desc: '陆地邻国投资需政府审批，包括中国', level: 'medium' as RiskLevel, date: '2026-08-10' },
                { title: '印尼本地化要求', desc: '新能源汽车本地化率要求逐年提高', level: 'medium' as RiskLevel, date: '2026-08-05' },
              ].map((item, idx) => {
                const cfg = levelConfig[item.level]
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start gap-3">
                      <cfg.icon className={`w-5 h-5 mt-0.5 ${cfg.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                        <p className="text-xs text-gray-400 mt-1">更新: {item.date}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">数据说明</p>
              <p className="text-sm text-amber-700 mt-1">
                合规与投资审查数据正在接入中。当前展示为精选案例，正式数据将接入
                中国出口管制信息网、商务部安全与管制局、欧盟法律数据库(EUR-Lex) 等信源。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ④ 供应链风险 */}
      {activeTab === 'supply' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">供应链断供风险</h3>
            <div className="space-y-4">
              {[
                { material: '锂', source: '澳大利亚/智利/阿根廷', concentration: 'CR3=75%', risk: 'medium', trend: 'up' },
                { material: '钴', source: '刚果(金)', concentration: 'CR3=65%', risk: 'high', trend: 'up' },
                { material: '镍', source: '印尼/菲律宾', concentration: 'CR3=55%', risk: 'medium', trend: 'stable' },
                { material: '稀土', source: '中国', concentration: 'CR1=60%', risk: 'low', trend: 'down' },
                { material: '石墨', source: '中国/莫桑比克', concentration: 'CR3=70%', risk: 'low', trend: 'stable' },
              ].map((item) => (
                <div key={item.material} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-20">
                    <span className="font-semibold text-gray-900">{item.material}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">主要来源: {item.source}</p>
                    <p className="text-sm text-gray-500">集中度: {item.concentration}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.risk === 'high' ? 'bg-red-100 text-red-700' :
                      item.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.risk === 'high' ? '高风险' : item.risk === 'medium' ? '中风险' : '低风险'}
                    </span>
                    {item.trend === 'up' ? <TrendingUp className="w-4 h-4 text-red-500" /> :
                     item.trend === 'down' ? <TrendingDown className="w-4 h-4 text-green-500" /> :
                     <Minus className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">数据说明</p>
              <p className="text-sm text-amber-700 mt-1">
                供应链风险数据正在接入中。当前展示为行业通用风险评估，正式数据将接入
                SMM、Benchmark Minerals、USGS 等矿产资源数据库。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
