import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, AlertTriangle, ShieldAlert, Globe, Clock,
  Minus, Landmark,
  FileWarning, Scale, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
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

// 供应链数据（带图表）
const supplyChainData = [
  { material: '锂', concentration: 75, risk: 'medium', riskLabel: '中风险', color: '#f59e0b', source: '澳大利亚/智利/阿根廷', alternatives: '阿根廷盐湖扩产、非洲锂矿' },
  { material: '钴', concentration: 65, risk: 'high', riskLabel: '高风险', color: '#ef4444', source: '刚果(金)', alternatives: '印尼镍钴伴生、电池去钴化(高镍/无钴)' },
  { material: '镍', concentration: 55, risk: 'medium', riskLabel: '中风险', color: '#f59e0b', source: '印尼/菲律宾', alternatives: '印尼RKEF产能扩张、废镍回收' },
  { material: '稀土', concentration: 60, risk: 'low', riskLabel: '低风险', color: '#22c55e', source: '中国', alternatives: '美国Mountain Pass、澳洲Lynas' },
  { material: '石墨', concentration: 70, risk: 'low', riskLabel: '低风险', color: '#22c55e', source: '中国/莫桑比克', alternatives: '非洲天然石墨、人造石墨' },
  { material: '锰', concentration: 45, risk: 'low', riskLabel: '低风险', color: '#22c55e', source: '南非/加蓬', alternatives: '澳洲、巴西替代矿源' },
]

const levelConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle; dot: string; glow: string }> = {
  high: { label: '高风险', color: 'text-[var(--danger)]', bg: 'bg-[rgba(255,77,109,0.08)]', border: 'border-[rgba(255,77,109,0.2)]', icon: AlertTriangle, dot: 'ch-dot-danger', glow: 'shadow-[0_0_12px_rgba(255,77,109,0.2)]' },
  medium: { label: '需关注', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: ShieldAlert, dot: 'ch-dot-amber', glow: 'shadow-[0_0_12px_rgba(250,204,21,0.15)]' },
  low: { label: '正常', color: 'text-[var(--teal)]', bg: 'bg-[rgba(60,230,180,0.08)]', border: 'border-[rgba(60,230,180,0.2)]', icon: Minus, dot: 'ch-dot-teal', glow: 'shadow-[0_0_12px_rgba(60,230,180,0.15)]' },
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

  // 从 API 数据推断风险等级
  const getRiskLevel = (type: string) => {
    if (type.includes('反倾销') || type.includes('反补贴') || type.includes('301')) return 'high'
    if (type.includes('关税')) return 'medium'
    return 'low'
  }

  const highRisks = filtered.filter((e) => getRiskLevel(e.type) === 'high')
  const mediumRisks = filtered.filter((e) => getRiskLevel(e.type) === 'medium')
  const lowRisks = filtered.filter((e) => getRiskLevel(e.type) === 'low')
  const nevRisks = filtered.filter((e) => e.nev_related)

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
        <div className="flex items-center gap-3 mb-2">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--danger)] tracking-wider uppercase">Risk Monitor</span>
        </div>
        <h2 className="text-2xl font-bold text-white">风险监控与动态预警</h2>
        <p className="text-[var(--muted-text)] mt-1">实时风险驾驶舱 · 关税壁垒 · 地缘政策 · 供应链监控</p>
      </div>

      {/* 风险分级统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '高风险事件', value: highRisks.length, sub: '需立即关注', color: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)]', icon: AlertTriangle, dot: 'ch-dot-danger' },
          { label: '需关注事件', value: mediumRisks.length, sub: '持续跟踪', color: 'bg-yellow-500/10 text-yellow-400', icon: ShieldAlert, dot: 'ch-dot-amber' },
          { label: '正常/利好', value: lowRisks.length, sub: '常规监控', color: 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)]', icon: Minus, dot: 'ch-dot-teal' },
          { label: 'NEV相关', value: nevRisks.length, sub: '直接影响', color: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)]', icon: Globe, dot: 'ch-dot' },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <span className={`${kpi.dot} mr-1`} />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-white ch-glow-num">{kpi.value}</p>
                <span className="text-xs text-[var(--muted-text)]">{kpi.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1 border-b border-[rgba(96,178,216,0.12)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[var(--cyan)] text-[var(--cyan)] shadow-[0_4px_20px_rgba(0,194,255,0.12)]'
                : 'border-transparent text-[var(--muted-text)] hover:text-white'
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
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <h3 className="text-lg font-semibold text-white mb-4">国别风险热力</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* 动态计算国别风险热力 */}
              {(() => {
                // 从 API 数据聚合国别风险
                const countryMap: Record<string, { score: number; events: number; level: RiskLevel }> = {}
                const sourceList = filtered.length > 0 ? filtered : riskEvents
                sourceList.forEach((e: any) => {
                  const country = e.country || '未知'
                  const level = 'type' in e ? getRiskLevel(e.type) : e.level
                  if (!countryMap[country]) {
                    countryMap[country] = { score: 0, events: 0, level: 'low' as RiskLevel }
                  }
                  countryMap[country].events++
                  const scoreAdd = level === 'high' ? 25 : level === 'medium' ? 15 : 5
                  countryMap[country].score += scoreAdd
                  // 取最高等级
                  if (level === 'high' || countryMap[country].level === 'low') {
                    countryMap[country].level = level
                  } else if (level === 'medium' && countryMap[country].level !== 'high') {
                    countryMap[country].level = level
                  }
                })
                // 合并预设数据
                countryRiskHeat.forEach((c) => {
                  if (!countryMap[c.country]) {
                    countryMap[c.country] = { score: c.score, events: c.events, level: c.level as RiskLevel }
                  }
                })
                return Object.entries(countryMap)
                  .sort((a, b) => b[1].score - a[1].score)
                  .slice(0, 12)
              })().map(([country, c]) => {
                  const cfg = c.level === 'high' ? levelConfig.high : c.level === 'medium' ? levelConfig.medium : levelConfig.low
                  return (
                    <div key={country} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.glow} transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{country}</span>
                        <span className={`text-xs font-bold ${cfg.color} ch-glow-num`}>{c.score}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-[var(--muted-text)]">{c.events}起事件</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
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
          </div>

          {/* 最新风险事件 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <h3 className="text-lg font-semibold text-white mb-4">最新风险事件</h3>
              <div className="space-y-3">
                {(filtered.length > 0 ? filtered.slice(0, 6) : riskEvents.slice(0, 6)).map((event) => {
                  const eventLevel = 'type' in event ? getRiskLevel(event.type) : event.level
                  const cfg = levelConfig[eventLevel as RiskLevel]
                  return (
                    <div key={event.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.glow}`}>
                      <cfg.icon className={`w-5 h-5 mt-0.5 ${cfg.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm">{event.title}</span>
                          {('nev_related' in event ? event.nev_related : event.nev) && (
                            <span className="px-1.5 py-0.5 bg-[rgba(255,77,109,0.08)] text-[var(--danger)] rounded text-xs font-medium">
                              NEV
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-text)]">
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
        </div>
      )}

      {/* ② 关税与贸易政策 */}
      {activeTab === 'barriers' && (
        <div className="space-y-4">
          {/* 筛选 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-text)]" />
                  <input
                    type="text"
                    placeholder="搜索案件或国家..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[rgba(96,178,216,0.15)] rounded-md text-sm bg-[#0a1a2b] text-white placeholder:text-[var(--muted-text)] focus:border-[rgba(0,194,255,0.4)] focus:shadow-[0_0_12px_rgba(0,194,255,0.12)] transition-all outline-none"
                  />
                </div>
                <button
                  onClick={() => { setQ(''); setTypeFilter(''); setOnlyNEV(false) }}
                  className="px-4 py-2 text-sm border border-[rgba(96,178,216,0.15)] rounded-md hover:bg-white/5 text-[var(--muted-text)] transition-all"
                >
                  重置
                </button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-[rgba(96,178,216,0.15)] rounded-md text-sm bg-[#0a1a2b] text-white focus:border-[rgba(0,194,255,0.4)] focus:shadow-[0_0_12px_rgba(0,194,255,0.12)] transition-all outline-none"
                >
                  <option value="">全部类型</option>
                  <option value="反倾销调查">反倾销调查</option>
                  <option value="反补贴调查">反补贴调查</option>
                  <option value="关税措施">关税措施</option>
                  <option value="贸易壁垒">贸易壁垒</option>
                </select>
                <label className="flex items-center gap-2 px-3 py-2 border border-[rgba(96,178,216,0.15)] rounded-md text-sm cursor-pointer hover:bg-white/5 text-[var(--muted-text)] transition-all">
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
          </div>

          {/* 案件列表 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-[var(--muted-text)]">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[var(--muted-text)]">暂无数据</div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className={`ch-card-cut ${c.nev_related ? 'ch-risk-bar' : ''}`}
                >
                  <div className={`ch-card-cut-inner p-5 ${c.nev_related ? 'border-[rgba(255,77,109,0.2)]' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white">{c.title}</h3>
                          {c.nev_related && (
                            <span className="px-2 py-0.5 bg-[rgba(255,77,109,0.08)] text-[var(--danger)] rounded text-xs font-medium flex items-center gap-1 shadow-[0_0_8px_rgba(255,77,109,0.15)]">
                              <AlertTriangle className="w-3 h-3" />
                              NEV
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted-text)] mt-1">{c.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                          <span className="px-2 py-0.5 bg-white/5 rounded text-[var(--muted-text)]">{c.country}</span>
                          <span className="px-2 py-0.5 bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] rounded shadow-[0_0_6px_rgba(0,194,255,0.1)]">{c.type}</span>
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded shadow-[0_0_6px_rgba(250,204,21,0.1)]">{c.status}</span>
                          <span className="text-[var(--muted-text)]">{c.date || '日期未知'}</span>
                        </div>
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
          {/* 合规审查分类概览 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'CFIUS审查', count: 3, country: '美国', icon: Landmark, color: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)]', dot: 'ch-dot-danger' },
              { label: '外国补贴条例', count: 2, country: '欧盟', icon: Scale, color: 'bg-yellow-500/10 text-yellow-400', dot: 'ch-dot-amber' },
              { label: 'FDI限制', count: 4, country: '印度/印尼等', icon: FileWarning, color: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)]', dot: 'ch-dot' },
              { label: '数据安全审查', count: 1, country: '欧盟/美国', icon: ShieldAlert, color: 'bg-purple-500/10 text-purple-400', dot: 'ch-dot' },
            ].map((item) => (
              <div key={item.label} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className={`${item.dot} mr-1`} />
                    <span className="text-xs text-[var(--muted-text)]">{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-white ch-glow-num">{item.count}</p>
                    <span className="text-xs text-[var(--muted-text)]">{item.country}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 审查案例列表 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <h3 className="text-lg font-semibold text-white mb-4">重点审查案例</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[rgba(0,194,255,0.06)] to-transparent border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">审查类型</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">国家/地区</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">主要内容</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">影响程度</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">NEV影响</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { type: 'CFIUS审查', country: '美国', desc: '对中资企业收购美汽车产业链企业的审查趋严，2024年阻止2起并购', impact: 'high', nev: true },
                      { type: '外国补贴条例', country: '欧盟', desc: '对获得政府补贴的企业在欧盟并购/投标进行审查，需申报补贴情况', impact: 'high', nev: true },
                      { type: 'FDI审批', country: '印度', desc: '陆地邻国投资需政府审批， Automotive领域审批周期6-18个月', impact: 'medium', nev: true },
                      { type: '本地化率要求', country: '印尼', desc: '新能源汽车本地化率2027年需达60%，电池 Pack 需本地组装', impact: 'medium', nev: true },
                      { type: '数据安全审查', country: '欧盟', desc: '车联网数据跨境传输需符合GDPR，自动驾驶数据不得出境', impact: 'medium', nev: true },
                      { type: '反垄断审查', country: '巴西', desc: '市场份额超20%需申报，审查周期90-240天', impact: 'low', nev: false },
                    ].map((row, idx) => {
                      const impactCfg = row.impact === 'high' ? { text: '高', color: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)] shadow-[0_0_8px_rgba(255,77,109,0.15)]' } :
                                       row.impact === 'medium' ? { text: '中', color: 'bg-yellow-500/10 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.1)]' } :
                                       { text: '低', color: 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)] shadow-[0_0_8px_rgba(60,230,180,0.1)]' }
                      return (
                        <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                          <td className="py-3 px-4 font-medium text-white">{row.type}</td>
                          <td className="py-3 px-4 text-[var(--muted-text)]">{row.country}</td>
                          <td className="py-3 px-4 text-[var(--muted-text)]">{row.desc}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactCfg.color}`}>{impactCfg.text}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.nev ? (
                              <span className="px-2 py-0.5 bg-[rgba(255,77,109,0.08)] text-[var(--danger)] rounded text-xs font-medium shadow-[0_0_8px_rgba(255,77,109,0.15)]">直接影响</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-white/5 text-[var(--muted-text)] rounded text-xs">间接</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 应对建议 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: '前置合规审查', icon: Scale, items: ['投资前完成CFIUS预申报评估', '梳理政府补贴明细，准备申报', '聘请当地律所做反垄断评估'] },
              { title: '本地化策略', icon: Globe, items: ['绿地投资替代并购，规避审查', '与当地企业合资，分散股权', '关键零部件属地化生产'] },
              { title: '数据合规', icon: ShieldAlert, items: ['欧盟数据本地化存储', '建立数据跨境传输合规框架', '隐私政策本地化适配'] },
            ].map((card) => (
              <div key={card.title} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <card.icon className="w-5 h-5 text-[var(--cyan)]" />
                    <h4 className="font-semibold text-white">{card.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {card.items.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] mt-1.5 flex-shrink-0 shadow-[0_0_4px_rgba(0,194,255,0.4)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-[rgba(96,178,216,0.12)] rounded-lg p-4 text-xs text-[var(--muted-text)]">
            数据来源：中国出口管制信息网、商务部安全与管制局、欧盟EUR-Lex、美国CFIUS公开记录。更新频率：每周。
          </div>
        </div>
      )}

      {/* ④ 供应链风险 */}
      {activeTab === 'supply' && (
        <div className="space-y-6">
          {/* 集中度对比图 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">关键材料集中度风险评估</h3>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-text)]">
                  <BarChart3 className="w-4 h-4" />
                  <span>CR3 = 前三企业集中度</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={supplyChainData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#809daf' }} />
                  <YAxis dataKey="material" type="category" width={60} tick={{ fontSize: 12, fill: '#809daf' }} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'CR3集中度']} contentStyle={{ backgroundColor: '#0a1a2b', borderColor: 'rgba(96,178,216,0.15)', color: '#eaf8ff' }} />
                  <Bar dataKey="concentration" name="CR3集中度(%)" radius={[0, 4, 4, 0]}>
                    {supplyChainData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 材料详情 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <h3 className="text-lg font-semibold text-white mb-4">材料来源与替代方案</h3>
              <div className="space-y-4">
                {supplyChainData.map((item) => (
                  <div key={item.material} className="p-4 rounded-lg border border-[rgba(96,178,216,0.08)] hover:border-[rgba(0,194,255,0.2)] hover:bg-[rgba(0,194,255,0.03)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{item.material}</span>
                        <span className="text-xs text-[var(--muted-text)]">主要来源: {item.source}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.risk === 'high' ? 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)] shadow-[0_0_8px_rgba(255,77,109,0.15)]' :
                        item.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.1)]' :
                        'bg-[rgba(60,230,180,0.08)] text-[var(--teal)] shadow-[0_0_8px_rgba(60,230,180,0.1)]'
                      }`}>
                        {item.riskLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex-1">
                        <p className="text-[var(--muted-text)]">替代方案</p>
                        <p className="text-white">{item.alternatives}</p>
                      </div>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs text-[var(--muted-text)] mb-1">
                          <span>集中度</span>
                          <span className="font-medium ch-glow-num">{item.concentration}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${item.concentration}%`, background: item.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 供应链韧性评估矩阵 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <h3 className="text-lg font-semibold text-white mb-4">供应链韧性评估矩阵</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[rgba(0,194,255,0.06)] to-transparent border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">维度</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">锂</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">钴</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">镍</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">稀土</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">石墨</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dim: '资源储量', li: '★★★★', co: '★★★', ni: '★★★★', re: '★★★★★', gr: '★★★★' },
                      { dim: '开采集中度', li: '★★★', co: '★★', ni: '★★★', re: '★★', gr: '★★★' },
                      { dim: '中国可控度', li: '★★★', co: '★★', ni: '★★★', re: '★★★★★', gr: '★★★★★' },
                      { dim: '替代难度', li: '★★★', co: '★★★★', ni: '★★★', re: '★★★★★', gr: '★★★' },
                      { dim: '价格波动性', li: '★★★★', co: '★★★★★', ni: '★★★', re: '★★', gr: '★★' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.dim}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{row.li}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{row.co}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{row.ni}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{row.re}</td>
                        <td className="py-3 px-4 text-center text-amber-400">{row.gr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-3">★ 越多表示该项指标越高（储量/集中度/可控度/难度/波动性）</p>
            </div>
          </div>

          <div className="bg-white/5 border border-[rgba(96,178,216,0.12)] rounded-lg p-4 text-xs text-[var(--muted-text)]">
            数据来源：SMM、Benchmark Minerals、USGS、中国稀土行业协会。更新频率：月度。
          </div>
        </div>
      )}
    </div>
  )
}
