import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import ReactECharts from 'echarts-for-react'
import {
  Factory, Battery, Car, Zap, TrendingUp, AlertCircle,
  GitBranch, ScrollText, Calendar,
} from 'lucide-react'
import { indicatorApi } from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// 类型
// ═══════════════════════════════════════════════════════════════
type TabKey = 'upstream' | 'midstream' | 'downstream' | 'sankey' | 'policy'

const TABS: { key: TabKey; label: string; icon: typeof Factory }[] = [
  { key: 'upstream', label: '上游·矿产原料', icon: Factory },
  { key: 'midstream', label: '中游·核心零部件', icon: Battery },
  { key: 'downstream', label: '下游·整车与应用', icon: Car },
  { key: 'sankey', label: '产业链全景图', icon: GitBranch },
  { key: 'policy', label: '政策时间轴', icon: ScrollText },
]

// ═══════════════════════════════════════════════════════════════
// 模拟数据（其他未接入真实数据的部分）
// ═══════════════════════════════════════════════════════════════


const midstreamData = [
  { name: '正极材料', value: 35, color: '#3b82f6' },
  { name: '负极材料', value: 25, color: '#10b981' },
  { name: '隔膜', value: 20, color: '#f59e0b' },
  { name: '电解液', value: 20, color: '#8b5cf6' },
]
const batteryData = [
  { name: '宁德时代', capacity: 35.2, share: 37 },
  { name: '比亚迪', capacity: 18.5, share: 19 },
  { name: 'LG新能源', capacity: 12.1, share: 13 },
  { name: '松下', capacity: 8.3, share: 9 },
  { name: '中创新航', capacity: 6.8, share: 7 },
  { name: '亿纬锂能', capacity: 5.2, share: 6 },
  { name: '其他', capacity: 8.9, share: 9 },
]

const vehicleData = [
  { month: '1月', nev: 72.9, total: 243 },
  { month: '2月', nev: 47.7, total: 158 },
  { month: '3月', nev: 88.3, total: 269 },
  { month: '4月', nev: 85.0, total: 236 },
  { month: '5月', nev: 95.5, total: 242 },
  { month: '6月', nev: 104.9, total: 262 },
]
const chargingData = [
  { type: '公共桩', count: 285 },
  { type: '私人桩', count: 520 },
  { type: '换电站', count: 3.2 },
]

interface PolicyItem {
  date: string
  title: string
  level: '国家级' | '部委级' | '地方级'
  summary: string
  impact: '强' | '中' | '弱'
}
const policyTimeline: PolicyItem[] = [
  { date: '2020-11', title: '新能源汽车产业发展规划(2021-2035)', level: '国家级', summary: '明确NEV渗透率2025年达20%、2035年达50%目标', impact: '强' },
  { date: '2021-09', title: '双积分政策修订', level: '部委级', summary: '提高新能源积分比例要求，2025年达28%', impact: '强' },
  { date: '2022-09', title: '新能源汽车购置税免征延续', level: '国家级', summary: '购置税免征延续至2023年底，后多次延期', impact: '强' },
  { date: '2023-05', title: '充电基础设施建设指导意见', level: '部委级', summary: '2025年建成充电桩超2000万台，换电站超2万座', impact: '中' },
  { date: '2023-12', title: '电池回收管理办法', level: '部委级', summary: '规范动力电池回收利用，建立生产者责任延伸制', impact: '中' },
  { date: '2024-03', title: '以旧换新补贴细则', level: '国家级', summary: 'NEV以旧换新补贴最高1万元，燃油车置换NEV额外奖励', impact: '强' },
  { date: '2024-06', title: '固态电池技术发展指导意见', level: '部委级', summary: '2027年固态电池实现装车，2030年成本降至液态电池1.2倍', impact: '中' },
  { date: '2025-01', title: '智能网联汽车准入试点', level: '部委级', summary: 'L3/L4级自动驾驶准入和上路通行试点启动', impact: '强' },
  { date: '2025-06', title: '新能源汽车出海支持政策', level: '国家级', summary: '出口信用保险、海外建厂金融支持、物流补贴一揽子方案', impact: '强' },
  { date: '2025-12', title: '碳足迹核算标准发布', level: '部委级', summary: '动力电池全生命周期碳足迹核算指南，应对欧盟CBAM', impact: '中' },
  { date: '2026-03', title: '车网互动(V2G)推广方案', level: '部委级', summary: '2028年V2G保有量超500万辆，建设虚拟电厂示范', impact: '弱' },
  { date: '2026-06', title: '下一代电池技术路线图', level: '国家级', summary: '凝聚态电池、钠离子电池、锂硫电池技术路线明确', impact: '中' },
]

// ═══════════════════════════════════════════════════════════════
// 桑基图配置
// ═══════════════════════════════════════════════════════════════
function useSankeyOption() {
  return useMemo(() => ({
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        nodeAlign: 'left',
        data: [
          { name: '锂矿', itemStyle: { color: '#3b82f6' } },
          { name: '钴矿', itemStyle: { color: '#6366f1' } },
          { name: '镍矿', itemStyle: { color: '#8b5cf6' } },
          { name: '石墨', itemStyle: { color: '#64748b' } },
          { name: '稀土', itemStyle: { color: '#a855f7' } },
          { name: '锂盐', itemStyle: { color: '#2563eb' } },
          { name: '钴材料', itemStyle: { color: '#4f46e5' } },
          { name: '镍材料', itemStyle: { color: '#7c3aed' } },
          { name: '负极材料', itemStyle: { color: '#475569' } },
          { name: '正极材料', itemStyle: { color: '#0ea5e9' } },
          { name: '隔膜', itemStyle: { color: '#06b6d4' } },
          { name: '电解液', itemStyle: { color: '#14b8a6' } },
          { name: '电芯', itemStyle: { color: '#10b981' } },
          { name: '模组', itemStyle: { color: '#22c55e' } },
          { name: 'PACK', itemStyle: { color: '#34d399' } },
          { name: 'BEV整车', itemStyle: { color: '#ef4444' } },
          { name: 'PHEV整车', itemStyle: { color: '#f97316' } },
          { name: 'EREV整车', itemStyle: { color: '#eab308' } },
          { name: '国内销售', itemStyle: { color: '#84cc16' } },
          { name: '海外出口', itemStyle: { color: '#22d3ee' } },
          { name: '电池回收', itemStyle: { color: '#a3a3a3' } },
        ],
        links: [
          { source: '锂矿', target: '锂盐', value: 45 },
          { source: '钴矿', target: '钴材料', value: 18 },
          { source: '镍矿', target: '镍材料', value: 280 },
          { source: '石墨', target: '负极材料', value: 120 },
          { source: '锂盐', target: '正极材料', value: 35 },
          { source: '锂盐', target: '电解液', value: 10 },
          { source: '钴材料', target: '正极材料', value: 15 },
          { source: '镍材料', target: '正极材料', value: 200 },
          { source: '负极材料', target: '电芯', value: 110 },
          { source: '稀土', target: '电芯', value: 25 },
          { source: '正极材料', target: '电芯', value: 250 },
          { source: '隔膜', target: '电芯', value: 80 },
          { source: '电解液', target: '电芯', value: 90 },
          { source: '电芯', target: '模组', value: 500 },
          { source: '模组', target: 'PACK', value: 480 },
          { source: 'PACK', target: 'BEV整车', value: 320 },
          { source: 'PACK', target: 'PHEV整车', value: 120 },
          { source: 'PACK', target: 'EREV整车', value: 40 },
          { source: 'BEV整车', target: '国内销售', value: 220 },
          { source: 'BEV整车', target: '海外出口', value: 100 },
          { source: 'PHEV整车', target: '国内销售', value: 100 },
          { source: 'PHEV整车', target: '海外出口', value: 20 },
          { source: 'EREV整车', target: '国内销售', value: 38 },
          { source: 'EREV整车', target: '海外出口', value: 2 },
          { source: 'PACK', target: '电池回收', value: 20 },
        ],
        lineStyle: { color: 'source', curveness: 0.5, opacity: 0.4 },
        label: {
          color: '#eaf8ff',
          fontSize: 12,
          fontWeight: 500,
        },
        top: '5%',
        bottom: '5%',
        left: '2%',
        right: '2%',
      },
    ],
  }), [])
}

// ═══════════════════════════════════════════════════════════════
// 组件主体
// ═══════════════════════════════════════════════════════════════
export default function IndustryChain() {
  const [activeTab, setActiveTab] = useState<TabKey>('downstream')
  const sankeyOption = useSankeyOption()

  // 政策筛选
  const [policyFilter, setPolicyFilter] = useState<'all' | '国家级' | '部委级' | '地方级'>('all')
  const filteredPolicies = policyFilter === 'all'
    ? policyTimeline
    : policyTimeline.filter(p => p.level === policyFilter)

  // ── 上游 C001 API 数据 ──
  const [lithiumData, setLithiumData] = useState<{month: string; capacity: number | null; output: number | null}[]>([])
  const [lithiumLoading, setLithiumLoading] = useState(false)

  // ── 上游 C002 API 数据（锂盐价格）──
  const [priceData, setPriceData] = useState<{month: string; price: number | null}[]>([])
  const [priceLoading, setPriceLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'upstream') return
    setLithiumLoading(true)
    indicatorApi.getPoints('lithium_capacity_production', { limit: 36 })
      .then(res => {
        const items = res.data.items || []
        // 按月份聚合：产能、产量
        const monthMap: Record<string, { capacity?: number; output?: number }> = {}
        items.forEach((item: any) => {
          const m = item.period_date?.slice(0, 7) // "2024-09"
          if (!m) return
          if (!monthMap[m]) monthMap[m] = {}
          const metric = item.dimension_json?.metric
          if (metric === '产能') monthMap[m].capacity = item.value
          if (metric === '产量') monthMap[m].output = item.value
        })
        const arr = Object.entries(monthMap)
          .map(([month, v]) => ({ month, capacity: v.capacity ?? null, output: v.output ?? null }))
          .filter(v => v.capacity != null || v.output != null)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12)
        setLithiumData(arr)
      })
      .catch(err => {
        console.error('C001 API error:', err)
      })
      .finally(() => setLithiumLoading(false))
  }, [activeTab])

  // C002 锂盐价格
  useEffect(() => {
    if (activeTab !== 'upstream') return
    setPriceLoading(true)
    indicatorApi.getPoints('lithium_price', { limit: 48 })
      .then(res => {
        const items = res.data.items || []
        const arr = items
          .map((item: any) => ({
            month: item.period_date?.slice(0, 7) ?? '',
            price: item.value ?? null,
          }))
          .filter((v: any) => v.month && v.price != null)
          .sort((a: any, b: any) => a.month.localeCompare(b.month))
          .slice(-24) // 最近24个月
        setPriceData(arr)
      })
      .catch(err => {
        console.error('C002 API error:', err)
      })
      .finally(() => setPriceLoading(false))
  }, [activeTab])

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] uppercase tracking-wider">Industry Chain</span>
        </div>
        <h2 className="text-2xl font-bold text-white">产业链全景看板</h2>
        <p className="text-[var(--muted-text)] mt-1">
          锂矿 → 材料 → 电池 → 整车 → 基础设施 全链路监控
        </p>
      </div>

      {/* ── 全链路 KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: '锂盐产能', value: '45万吨', icon: Factory, dot: 'ch-dot' },
          { label: '动力电池装机', value: '93.2GWh', icon: Battery, dot: 'ch-dot ch-dot-teal' },
          { label: 'NEV销量(6月)', value: '104.9万辆', icon: Car, dot: 'ch-dot' },
          { label: '充电桩保有量', value: '805万台', icon: Zap, dot: 'ch-dot ch-dot-amber' },
          { label: 'NEV渗透率', value: '40.1%', icon: TrendingUp, dot: 'ch-dot' },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-4">
              <div className="flex items-center gap-2">
                <span className={kpi.dot} />
                <kpi.icon className="w-4 h-4 text-[var(--muted-text)]" />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold text-white ch-glow-num mt-2">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab 切换 ── */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[rgba(96,178,216,0.12)] scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--cyan)] text-[var(--cyan)] bg-[rgba(0,194,255,0.08)] shadow-[0_0_12px_rgba(0,194,255,0.15)]'
                : 'border-transparent text-[var(--muted-text)] hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ① 上游 · 矿产原料                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'upstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── 左图：C001 锂盐产能与产量（API 真实数据）── */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">锂盐产能与产量（API实时）</h3>
                  {lithiumLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
                </div>
                {lithiumData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={lithiumData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#809daf' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                      <Bar dataKey="capacity" name="产能(万吨/月)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="output" name="产量(万吨)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[var(--muted-text)]">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* ── 右图：原材料价格走势（模拟数据）── */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">锂盐价格走势（万元/吨·API实时）</h3>
                  {priceLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
                </div>
                {priceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#809daf' }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 12, fill: '#809daf' }} domain={[0, 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                      <Line type="monotone" dataKey="price" name="电池级碳酸锂" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[var(--muted-text)]">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          </div>

          <SourceNote>
            左侧「锂盐产能与产量」已接入 C001 采集器真实数据（SMM/百川盈孚行业基准）。右侧「锂盐价格走势」已接入 C002 采集器真实数据（SMM行业基准价格）。钴、镍价格待 C002-扩展 采集器接入。
          </SourceNote>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 中游 · 核心零部件                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'midstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">四大材料产能占比</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={midstreamData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: any) => `${name}: ${value}%`}
                    >
                      {midstreamData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">动力电池企业装机量 TOP 榜（GWh）</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={batteryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip />
                    <Bar dataKey="capacity" name="装机量(GWh)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <SourceNote>
            当前展示为模拟数据。正式数据将接入 高工锂电(GGII)、电池中国、起点锂电、赛迪研究院、SNE Research 等数据源。
          </SourceNote>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 下游 · 整车与应用                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'downstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">NEV 销量与渗透率走势</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={vehicleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip />
                    <Bar dataKey="nev" name="NEV 销量(万辆)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">补能设施保有量（万台/座）</h3>
                </div>
                <div className="space-y-4 mt-4">
                  {chargingData.map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm font-medium text-[var(--muted-text)]">{item.type}</span>
                      <span className="text-lg font-bold text-white ch-glow-num">{item.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chargingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="count"
                        nameKey="type"
                      >
                        {chargingData.map((_, i) => (
                          <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b'][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* 整车企业梯队 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">整车企业销量梯队（2026 上半年）</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">排名</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">企业</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">销量（万辆）</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">同比</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">梯队</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: '比亚迪', sales: 161.3, yoy: '+28.5%', tier: '第一梯队' },
                      { rank: 2, name: '特斯拉中国', sales: 42.8, yoy: '-3.2%', tier: '第一梯队' },
                      { rank: 3, name: '吉利新能源', sales: 38.2, yoy: '+65.1%', tier: '第二梯队' },
                      { rank: 4, name: '长安汽车', sales: 29.9, yoy: '+52.8%', tier: '第二梯队' },
                      { rank: 5, name: '奇瑞新能源', sales: 25.4, yoy: '+182%', tier: '第二梯队' },
                      { rank: 6, name: '理想汽车', sales: 18.9, yoy: '+35.8%', tier: '第三梯队' },
                      { rank: 7, name: '鸿蒙智行', sales: 17.4, yoy: '+520%', tier: '第三梯队' },
                      { rank: 8, name: '广汽埃安', sales: 16.2, yoy: '-15.3%', tier: '第三梯队' },
                    ].map((row) => (
                      <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 text-white font-medium">{row.rank}</td>
                        <td className="py-3 px-4 text-white">{row.name}</td>
                        <td className="py-3 px-4 text-right text-white font-semibold">{row.sales}</td>
                        <td className={`py-3 px-4 text-right font-medium ${row.yoy.startsWith('+') ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                          {row.yoy}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row.tier === '第一梯队' ? 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)]' :
                            row.tier === '第二梯队' ? 'bg-[rgba(60,230,180,0.12)] text-[var(--teal)]' :
                            'bg-white/10 text-[var(--muted-text)]'
                          }`}>
                            {row.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <SourceNote>
            当前展示为模拟数据。正式数据将接入 中汽协(CAAM)、乘联会(CPCA)、中汽中心(CATARC)、中国充电联盟(EVCIPA)、国家能源局、IEA 等数据源。
          </SourceNote>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 产业链全景图（桑基图）                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'sankey' && (
        <div className="space-y-6">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">新能源汽车产业链全景流向图</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-text)]">
                  <GitBranch className="w-4 h-4" />
                  <span>单位：万吨 / GWh / 万辆（相对比例示意）</span>
                </div>
              </div>
              <ReactECharts
                option={sankeyOption}
                style={{ height: 600, width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>

          {/* 图例说明 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '上游矿产', color: 'bg-blue-500', desc: '锂/钴/镍/石墨' },
              { label: '中游材料', color: 'bg-cyan-500', desc: '正极/负极/隔膜/电解液' },
              { label: '电池制造', color: 'bg-green-500', desc: '电芯/模组/PACK' },
              { label: '下游整车', color: 'bg-red-500', desc: 'BEV/PHEV/EREV' },
            ].map(item => (
              <div key={item.label} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-3 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-[var(--muted-text)]">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SourceNote>
            桑基图数据基于 2026 上半年行业估算值构建，展示产业链各环节物料流向关系。正式版本将接入供应链数据库实现动态更新。
          </SourceNote>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑤ 政策时间轴                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          {/* 筛选器 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-text)]">政策级别：</span>
            {(['all', '国家级', '部委级', '地方级'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setPolicyFilter(level)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  policyFilter === level
                    ? 'bg-[var(--cyan)] text-[#06111e] shadow-[0_0_12px_rgba(0,194,255,0.25)]'
                    : 'bg-white/5 text-[var(--muted-text)] hover:bg-white/10 hover:text-white'
                }`}
              >
                {level === 'all' ? '全部' : level}
              </button>
            ))}
          </div>

          {/* 时间轴 */}
          <div className="relative">
            {/* 中轴线 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[rgba(96,178,216,0.12)] lg:left-1/2 lg:-ml-px" />

            <div className="space-y-8">
              {filteredPolicies.map((policy, idx) => {
                const isLeft = idx % 2 === 0
                const impactColor =
                  policy.impact === '强' ? 'bg-[rgba(255,77,109,0.08)] border-[rgba(255,77,109,0.2)] text-[var(--danger)]' :
                  policy.impact === '中' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                  'bg-white/5 border-[rgba(96,178,216,0.12)] text-[var(--muted-text)]'
                const levelBadge =
                  policy.level === '国家级' ? 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]' :
                  policy.level === '部委级' ? 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)]' :
                  'bg-[rgba(60,230,180,0.12)] text-[var(--teal)]'

                return (
                  <div key={idx} className="relative flex items-start lg:items-center">
                    {/* 时间节点圆点 */}
                    <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-[var(--cyan)] border-2 border-[#0a1a2b] shadow -ml-[5px] z-10" />

                    {/* 内容卡片 */}
                    <div className={`ml-10 lg:ml-0 lg:w-[calc(50%-2rem)] ${isLeft ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                      <div className="ch-card-cut">
                        <div className="ch-card-cut-inner p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-[var(--muted-text)]" />
                            <span className="text-sm font-medium text-[var(--muted-text)]">{policy.date}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBadge}`}>
                              {policy.level}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${impactColor}`}>
                              影响:{policy.impact}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-white mb-1">{policy.title}</h4>
                          <p className="text-sm text-[var(--muted-text)]">{policy.summary}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <SourceNote>
            政策数据基于公开信息整理。正式版本将接入 国务院、工信部、财政部、发改委、市场监管总局 等官方渠道，实现政策自动抓取与影响评估。
          </SourceNote>
        </div>
      )}
    </div>
  )
}

// ── 数据来源说明小组件 ──
function SourceNote({ children }: { children: string }) {
  return (
    <div className="ch-risk-bar rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-400">数据来源说明</p>
        <p className="text-sm text-amber-300 mt-1">{children}</p>
      </div>
    </div>
  )
}
