import { useState, useEffect } from 'react'
import { indicatorApi } from '@/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  Ship,
  Package,
  Globe2,
  Building2,
  Truck,
  Banknote,
  Award,
  AlertCircle,
} from 'lucide-react'

// ── 类型 ──
type TabKey = 'scale' | 'product' | 'region' | 'brand' | 'mode' | 'price' | 'compete'

// ── Tab 配置 ──
const TABS: { key: TabKey; label: string; icon: typeof Ship }[] = [
  { key: 'scale', label: '规模与趋势', icon: Ship },
  { key: 'product', label: '产品与动力结构', icon: Package },
  { key: 'region', label: '区域与目的国', icon: Globe2 },
  { key: 'brand', label: '品牌与企业', icon: Building2 },
  { key: 'mode', label: '出口模式', icon: Truck },
  { key: 'price', label: '单价与价值', icon: Banknote },
  { key: 'compete', label: '竞争力与附加值', icon: Award },
]

// ═══════════════════════════════════════════════════════════════
// ① 规模与趋势
// ═══════════════════════════════════════════════════════════════
// const exportScaleData = [  // replaced by API data
//   { year: '2021', total: 201.5, nev: 31.0 },
//   { year: '2022', total: 311.1, nev: 67.9 },
//   { year: '2023', total: 491.0, nev: 120.3 },
//   { year: '2024', total: 585.9, nev: 201.0 },
//   { year: '2025(预)', total: 680.0, nev: 280.0 },
// ]

const monthlyTrend = [
  { month: '1月', export: 58.3, yoy: '+47.4%' },
  { month: '2月', export: 37.7, yoy: '+14.7%' },
  { month: '3月', export: 58.2, yoy: '+26.8%' },
  { month: '4月', export: 59.4, yoy: '+25.7%' },
  { month: '5月', export: 62.5, yoy: '+29.2%' },
  { month: '6月', export: 58.7, yoy: '+25.8%' },
]

// ═══════════════════════════════════════════════════════════════
// ② 产品品类
// ═══════════════════════════════════════════════════════════════
const productStructure = [
  { type: 'BEV纯电', count: 85.4, share: 61.2 },
  { type: 'PHEV插混', count: 42.8, share: 30.7 },
  { type: 'HEV混动', count: 9.1, share: 6.5 },
  { type: 'EREV增程', count: 2.2, share: 1.6 },
]

const vehicleTypeTrend = [
  { month: '1月', bev: 32.5, phev: 18.3, hev: 5.2, erev: 2.3 },
  { month: '2月', bev: 21.8, phev: 11.5, hev: 3.1, erev: 1.3 },
  { month: '3月', bev: 35.2, phev: 17.8, hev: 3.9, erev: 1.3 },
  { month: '4月', bev: 36.5, phev: 16.8, hev: 4.2, erev: 1.9 },
  { month: '5月', bev: 38.2, phev: 18.5, hev: 3.8, erev: 2.0 },
  { month: '6月', bev: 35.8, phev: 17.2, hev: 4.1, erev: 1.6 },
]

// ═══════════════════════════════════════════════════════════════
// ③ 区域与目的国
// ═══════════════════════════════════════════════════════════════
const topDestinations = [
  { country: '俄罗斯', value: 12.8, share: 18.2 },
  { country: '墨西哥', value: 8.5, share: 12.1 },
  { country: '阿联酋', value: 6.2, share: 8.9 },
  { country: '比利时', value: 5.8, share: 8.3 },
  { country: '沙特', value: 4.5, share: 6.4 },
  { country: '澳大利亚', value: 3.9, share: 5.6 },
  { country: '英国', value: 3.5, share: 5.0 },
  { country: '泰国', value: 3.2, share: 4.6 },
  { country: '菲律宾', value: 2.8, share: 4.0 },
  { country: '土耳其', value: 2.5, share: 3.6 },
]

const regionPie = [
  { name: '欧洲', value: 28, color: '#3b82f6' },
  { name: '亚洲(不含中国)', value: 26, color: '#10b981' },
  { name: '中东', value: 18, color: '#f59e0b' },
  { name: '拉美', value: 15, color: '#8b5cf6' },
  { name: '俄罗斯/独联体', value: 10, color: '#ef4444' },
  { name: '其他', value: 3, color: '#6b7280' },
]

// ═══════════════════════════════════════════════════════════════
// ④ 品牌与企业
// ═══════════════════════════════════════════════════════════════
const brandExport = [
  { brand: '奇瑞', export: 28.5, share: 20.4 },
  { brand: '上汽', export: 19.2, share: 13.8 },
  { brand: '比亚迪', export: 17.8, share: 12.8 },
  { brand: '吉利', export: 15.6, share: 11.2 },
  { brand: '长安', export: 12.3, share: 8.8 },
  { brand: '长城', export: 10.5, share: 7.5 },
  { brand: '特斯拉中国', export: 8.2, share: 5.9 },
  { brand: '其他', export: 25.9, share: 18.6 },
]

// ═══════════════════════════════════════════════════════════════
// ⑤ 出口模式
// ═══════════════════════════════════════════════════════════════
const modeData = [
  { mode: '整车出口(FOB)', value: 55, color: '#3b82f6' },
  { mode: 'CKD/SKD散件', value: 25, color: '#10b981' },
  { mode: '海外建厂地产', value: 15, color: '#f59e0b' },
  { mode: '合资/技术授权', value: 5, color: '#8b5cf6' },
]

const modeTrendData = [
  { year: '2021', fob: 72, ckd: 15, plant: 10, license: 3 },
  { year: '2022', fob: 68, ckd: 18, plant: 11, license: 3 },
  { year: '2023', fob: 62, ckd: 22, plant: 12, license: 4 },
  { year: '2024', fob: 58, ckd: 24, plant: 14, license: 4 },
  { year: '2025(预)', fob: 55, ckd: 25, plant: 15, license: 5 },
]

const modeInvestmentData = [
  { mode: '整车出口(FOB)', investment: 5, period: 6, risk: '低' },
  { mode: 'CKD/SKD散件', investment: 25, period: 12, risk: '中' },
  { mode: '海外建厂', investment: 80, period: 36, risk: '高' },
  { mode: '合资/技术授权', investment: 15, period: 18, risk: '中低' },
]

const modeCompareRows = [
  { mode: '整车出口(FOB)', desc: '直接出口整车，灵活快速', investment: 5, period: 6, risk: '低', riskColor: 'text-[var(--teal)] bg-[rgba(60,230,180,0.08)]', pros: '投入低、周期短、灵活', cons: '受关税壁垒影响大' },
  { mode: 'CKD/SKD散件', desc: '出口零部件，当地组装', investment: 25, period: 12, risk: '中', riskColor: 'text-yellow-400 bg-yellow-500/10', pros: '规避部分关税、属地化', cons: '需当地建厂/合作' },
  { mode: '海外建厂', desc: '绿地投资或并购建厂', investment: 80, period: 36, risk: '高', riskColor: 'text-[var(--danger)] bg-[rgba(255,77,109,0.08)]', pros: '绕过关税、贴近市场', cons: '投入大、周期长、政治风险' },
  { mode: '合资/技术授权', desc: '技术输出+本地生产', investment: 15, period: 18, risk: '中低', riskColor: 'text-[var(--cyan)] bg-[rgba(0,194,255,0.08)]', pros: '轻资产、共享渠道', cons: '利润分成、技术外溢风险' },
]

// ═══════════════════════════════════════════════════════════════
// ⑥ 单价与价值
// ═══════════════════════════════════════════════════════════════
const priceTrendData = [
  { year: '2020', price: 1.18 },
  { year: '2021', price: 1.35 },
  { year: '2022', price: 1.52 },
  { year: '2023', price: 1.68 },
  { year: '2024', price: 1.85 },
  { year: '2025(预)', price: 2.05 },
]

const countryPriceData = [
  { country: '英国', price: 3.2, type: 'BEV高端' },
  { country: '德国', price: 2.8, type: 'BEV/SUV' },
  { country: '比利时', price: 2.6, type: 'BEV' },
  { country: '澳大利亚', price: 2.4, type: 'SUV/皮卡' },
  { country: '沙特', price: 2.1, type: 'SUV' },
  { country: '俄罗斯', price: 1.8, type: 'SUV/轿车' },
  { country: '墨西哥', price: 1.6, type: 'SUV/皮卡' },
  { country: '泰国', price: 1.5, type: 'BEV/PHEV' },
  { country: '菲律宾', price: 1.3, type: 'SUV/MPV' },
  { country: '阿联酋', price: 2.0, type: 'SUV' },
]

const valueAddedData = [
  { category: '整车出口', value: 55, addedRate: 35 },
  { category: '零部件出口', value: 25, addedRate: 45 },
  { category: '技术服务', value: 12, addedRate: 75 },
  { category: '品牌授权', value: 8, addedRate: 85 },
]

// ═══════════════════════════════════════════════════════════════
// ⑦ 竞争力
// ═══════════════════════════════════════════════════════════════
const competeIndexData = [
  { year: '2020', china: 0.42, japan: 0.68, germany: 0.72, korea: 0.55 },
  { year: '2021', china: 0.48, japan: 0.66, germany: 0.70, korea: 0.54 },
  { year: '2022', china: 0.55, japan: 0.63, germany: 0.68, korea: 0.53 },
  { year: '2023', china: 0.62, japan: 0.60, germany: 0.65, korea: 0.52 },
  { year: '2024', china: 0.68, japan: 0.58, germany: 0.63, korea: 0.50 },
  { year: '2025(预)', china: 0.72, japan: 0.55, germany: 0.60, korea: 0.48 },
]

const addedValueStructure = [
  { name: '核心零部件', value: 22, color: '#3b82f6' },
  { name: '整车制造', value: 28, color: '#f59e0b' },
  { name: '品牌营销', value: 15, color: '#8b5cf6' },
  { name: '售后服务', value: 12, color: '#ef4444' },
  { name: '其他', value: 5, color: '#6b7280' },
]

// ═══════════════════════════════════════════════════════════════
// 组件主体
// ═══════════════════════════════════════════════════════════════
export default function ExportAnalysis() {
  const [activeTab, setActiveTab] = useState<TabKey>('scale')

  // ── C008 出口总量及占比趋势 ──
  const [exportTrendData, setExportTrendData] = useState<{month: string; total: number | null; ratio: number | null}[]>([])
  const [exportTrendLoading, setExportTrendLoading] = useState(false)

  // ── C009 出口目的地 TOP10 ──
  const [exportDestData, setExportDestData] = useState<{country: string; volume: number}[]>([])
  const [exportDestLoading, setExportDestLoading] = useState(false)

  // C008 出口趋势
  useEffect(() => {
    if (activeTab !== 'scale') return
    setExportTrendLoading(true)
    indicatorApi.getPoints('nev_export_trend', { limit: 48 })
      .then(res => {
        const items = res.data.items || []
        const monthMap: Record<string, { total?: number; ratio?: number }> = {}
        items.forEach((item: any) => {
          const m = item.period_date?.slice(0, 7)
          if (!m) return
          if (!monthMap[m]) monthMap[m] = {}
          const metric = item.dimension_json?.metric
          if (metric === '出口总量') monthMap[m].total = item.value
          if (metric === '出口占比') monthMap[m].ratio = item.value
        })
        const arr = Object.entries(monthMap)
          .map(([month, v]) => ({ month, total: v.total ?? null, ratio: v.ratio ?? null }))
          .filter(v => v.total != null || v.ratio != null)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12)
        setExportTrendData(arr)
      })
      .catch(err => console.error('C008 API error:', err))
      .finally(() => setExportTrendLoading(false))
  }, [activeTab])

  // C009 出口目的地
  useEffect(() => {
    if (activeTab !== 'region') return
    setExportDestLoading(true)
    indicatorApi.getPoints('nev_export_destinations', { limit: 20 })
      .then(res => {
        const items = res.data.items || []
        const arr = items
          .map((item: any) => ({
            country: item.dimension_json?.country || '未知',
            volume: item.value ?? 0,
          }))
          .sort((a: any, b: any) => b.volume - a.volume)
          .slice(0, 10)
        setExportDestData(arr)
      })
      .catch(err => console.error('C009 API error:', err))
      .finally(() => setExportDestLoading(false))
  }, [activeTab])

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] uppercase tracking-wider">Export Analysis</span>
        </div>
        <h2 className="text-2xl font-bold text-white">出口分析</h2>
        <p className="text-[var(--muted-text)] mt-1">
          出了多少、卖到哪、谁在出、怎么出、赚不赚 — 七大维度全景分析
        </p>
      </div>

      {/* ── 核心 KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '上半年出口总量', value: '293.0万辆', sub: '同比 +25.3%', dot: 'ch-dot' },
          { label: 'NEV出口占比', value: '47.5%', sub: 'BEV+PHEV', dot: 'ch-dot ch-dot-teal' },
          { label: 'TOP1目的国', value: '俄罗斯', sub: '占比 18.2%', dot: 'ch-dot' },
          { label: 'TOP1出口车企', value: '奇瑞', sub: '出口 28.5万辆', dot: 'ch-dot ch-dot-amber' },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-4">
              <div className="flex items-center gap-2">
                <span className={kpi.dot} />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-white ch-glow-num mt-1">{kpi.value}</p>
              <p className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-white/5 text-[var(--muted-text)]">
                {kpi.sub}
              </p>
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
      {/* ① 规模与趋势                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'scale' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">
                    NEV 出口总量与占比趋势（API实时）
                  </h3>
                  {exportTrendLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={exportTrendData.length > 0 ? exportTrendData : [{month:'暂无',total:0,ratio:0}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#809daf' }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Bar dataKey="total" name="出口总量(万辆)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ratio" name="出口占比(%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">
                    2026 上半年月度出口走势（万辆）
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="exportColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Area type="monotone" dataKey="export" name="出口量" stroke="#3b82f6" fillOpacity={1} fill="url(#exportColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 产品与动力结构                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'product' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">出口产品结构（动力类型）</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={productStructure}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="share"
                      nameKey="type"
                      label={({ type, share }: any) => `${type}: ${share}%`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
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
                  <h3 className="text-lg font-semibold text-white">分动力类型月度出口走势</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={vehicleTypeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Line type="monotone" dataKey="bev" name="BEV" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="phev" name="PHEV" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hev" name="HEV" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="erev" name="EREV" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 区域与目的国                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'region' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">出口目的国 TOP10（万辆·API实时）</h3>
                  {exportDestLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={exportDestData.length > 0 ? exportDestData : topDestinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis dataKey="country" type="category" width={70} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Bar dataKey="value" name="出口量(万辆)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">区域分布占比</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={regionPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: any) => `${name}: ${value}%`}
                    >
                      {regionPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 目的国详细表格 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">出口目的国详细数据</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">排名</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">国家/地区</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">出口量(万辆)</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">占比</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">同比</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">主要出口车型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, country: '俄罗斯', value: 12.8, share: '18.2%', yoy: '+38.5%', models: 'SUV、轿车' },
                      { rank: 2, country: '墨西哥', value: 8.5, share: '12.1%', yoy: '+52.1%', models: 'SUV、皮卡' },
                      { rank: 3, country: '阿联酋', value: 6.2, share: '8.9%', yoy: '+28.7%', models: 'SUV' },
                      { rank: 4, country: '比利时', value: 5.8, share: '8.3%', yoy: '+15.3%', models: 'BEV、SUV' },
                      { rank: 5, country: '沙特', value: 4.5, share: '6.4%', yoy: '+42.0%', models: 'SUV' },
                      { rank: 6, country: '澳大利亚', value: 3.9, share: '5.6%', yoy: '+18.5%', models: 'SUV、皮卡' },
                      { rank: 7, country: '英国', value: 3.5, share: '5.0%', yoy: '+22.1%', models: 'BEV、SUV' },
                      { rank: 8, country: '泰国', value: 3.2, share: '4.6%', yoy: '+35.8%', models: 'BEV、PHEV' },
                      { rank: 9, country: '菲律宾', value: 2.8, share: '4.0%', yoy: '+65.2%', models: 'SUV、MPV' },
                      { rank: 10, country: '土耳其', value: 2.5, share: '3.6%', yoy: '+48.3%', models: 'SUV' },
                    ].map((row) => (
                      <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.rank}</td>
                        <td className="py-3 px-4 text-white">{row.country}</td>
                        <td className="py-3 px-4 text-right font-semibold text-white">{row.value}</td>
                        <td className="py-3 px-4 text-right text-[var(--muted-text)]">{row.share}</td>
                        <td className="py-3 px-4 text-right text-[var(--teal)] font-medium">{row.yoy}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.models}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 品牌与企业                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'brand' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">出口企业排名（万辆）</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={brandExport} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis dataKey="brand" type="category" width={90} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Bar dataKey="export" name="出口量(万辆)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">企业出口份额占比</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={brandExport.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="share"
                      nameKey="brand"
                    >
                      {brandExport.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑤ 出口模式                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'mode' && (
        <div className="space-y-6">
          {/* 模式占比 + 趋势 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">出口模式结构占比</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="mode"
                      label={({ mode, value }: any) => `${mode}: ${value}%`}
                    >
                      {modeData.map((entry, i) => (
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
                  <h3 className="text-lg font-semibold text-white">出口模式趋势变化（%）</h3>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={modeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Line type="monotone" dataKey="fob" name="整车出口" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ckd" name="CKD/SKD" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="plant" name="海外建厂" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="license" name="技术授权" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 模式对比矩阵 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">出口模式对比矩阵</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">出口模式</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">核心特征</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">投资额(百万美元)</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">回收周期(月)</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">风险等级</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">优势</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">劣势</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modeCompareRows.map((item, idx) => (
                      <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{item.mode}</td>
                        <td className="py-3 px-4 text-[var(--muted-text)]">{item.desc}</td>
                        <td className="py-3 px-4 text-right font-semibold text-white">${item.investment}M</td>
                        <td className="py-3 px-4 text-right text-[var(--muted-text)]">{item.period}个月</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.riskColor}`}>
                            {item.risk}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--teal)] text-xs">{item.pros}</td>
                        <td className="py-3 px-4 text-[var(--danger)] text-xs">{item.cons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 投资规模对比 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">各模式初始投资规模对比（百万美元）</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={modeInvestmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#809daf' }} />
                  <YAxis dataKey="mode" type="category" width={120} tick={{ fontSize: 12, fill: '#809daf' }} />
                  <Tooltip formatter={(value: number) => [`$${value}M`, '投资额']} contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                  <Bar dataKey="investment" name="投资额(百万美元)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑥ 单价与价值                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'price' && (
        <div className="space-y-6">
          {/* 均价走势 + 国别价格 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">
                    中国出口汽车均价走势（万美元/辆）
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={priceTrendData}>
                    <defs>
                      <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis domain={[0, 3]} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip formatter={(value: number) => [`$${value}万`, '均价']} contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Area type="monotone" dataKey="price" name="出口均价" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#priceColor)" />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-[var(--muted-text)] mt-3">
                  2020-2025 年均价从 $1.18万 提升至 $2.05万，涨幅 +73.7%，体现出口车型结构向高端化升级。
                </p>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">主要目的国单车均价对比（万美元）</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={countryPriceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis dataKey="country" type="category" width={70} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip formatter={(value: number) => [`$${value}万`, '均价']} contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Bar dataKey="price" name="均价(万美元)" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 出口金额与数量双轴图 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">出口金额与数量双轴走势</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {[
                  { label: '2025H1 出口额', value: '$580亿', sub: '同比+31.2%', dot: 'ch-dot' },
                  { label: '2025H1 出口量', value: '293万辆', sub: '同比+25.3%', dot: 'ch-dot ch-dot-teal' },
                  { label: '单车均价', value: '$1.98万', sub: '同比+4.7%', dot: 'ch-dot ch-dot-amber' },
                ].map((kpi) => (
                  <div key={kpi.label} className="ch-card-cut-sm">
                    <div className="ch-card-cut-sm-inner p-3">
                      <div className="flex items-center gap-2">
                        <span className={kpi.dot} />
                        <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
                      </div>
                      <p className="text-lg font-bold text-white ch-glow-num">{kpi.value}</p>
                      <p className="text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded bg-white/5 text-[var(--muted-text)]">{kpi.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 出口附加值结构 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">出口附加值结构分析</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={valueAddedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="category"
                      label={({ category, value }: any) => `${category}: ${value}%`}
                    >
                      {valueAddedData.map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="ch-title-bar" />
                    <h4 className="font-medium text-white">附加值率对比</h4>
                  </div>
                  {valueAddedData.map((item) => (
                    <div key={item.category} className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-text)] w-24">{item.category}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.addedRate}%` }} />
                      </div>
                      <span className="text-sm font-medium text-white w-12 text-right">{item.addedRate}%</span>
                    </div>
                  ))}
                  <p className="text-xs text-[var(--muted-text)] mt-2">
                    技术服务与品牌授权附加值率最高（75%-85%），但占比仍低；整车制造附加值率 35%，是主要出口形态。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑦ 竞争力与附加值                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'compete' && (
        <div className="space-y-6">
          {/* 竞争力指数趋势 + 附加值结构 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">贸易竞争力指数（TC 指数）趋势</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={competeIndexData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip formatter={(value: number) => [value.toFixed(2), 'TC 指数']} contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Line type="monotone" dataKey="china" name="中国" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="japan" name="日本" stroke="#6b7280" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="germany" name="德国" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="korea" name="韩国" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-[var(--muted-text)] mt-3">
                  TC 指数 = (出口-进口)/(出口+进口)，范围[-1, 1]。中国 NEV 竞争力指数从 2020 年的 0.42 快速提升至 2025 年的 0.72，已超越日韩，接近德国水平。
                </p>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">产业链附加值分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={addedValueStructure}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: any) => `${name}: ${value}%`}
                    >
                      {addedValueStructure.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 竞争力对比矩阵 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">中国 NEV 出口竞争力对标分析</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">维度</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">中国</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">日本</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">德国</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">韩国</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">中国优劣势</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dim: '成本控制能力', cn: '★★★★★', jp: '★★★★☆', de: '★★★☆☆', kr: '★★★★☆', note: '产业链完整，规模效应显著' },
                      { dim: '技术创新力', cn: '★★★★☆', jp: '★★★★★', de: '★★★★★', kr: '★★★★☆', note: '三电技术领先，品牌溢价待提升' },
                      { dim: '品牌认知度', cn: '★★★☆☆', jp: '★★★★★', de: '★★★★★', kr: '★★★★☆', note: '新兴市场认可度高，欧美待突破' },
                      { dim: '供应链韧性', cn: '★★★★★', jp: '★★★★☆', de: '★★★☆☆', kr: '★★★★☆', note: '电池/材料全产业链自主可控' },
                      { dim: '渠道覆盖', cn: '★★★★☆', jp: '★★★★★', de: '★★★★★', kr: '★★★☆☆', note: '快速扩张中，海外渠道深度不足' },
                      { dim: '政策支持', cn: '★★★★★', jp: '★★★☆☆', de: '★★★☆☆', kr: '★★★★☆', note: '出口退税+海外建厂补贴力度大' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.dim}</td>
                        <td className="py-3 px-4 text-center text-[var(--danger)] font-medium">{row.cn}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.jp}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.de}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.kr}</td>
                        <td className="py-3 px-4 text-xs text-[var(--muted-text)]">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 核心结论卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: '核心优势', icon: '★', color: 'bg-[rgba(60,230,180,0.08)] border-[rgba(60,230,180,0.2)]', textColor: 'text-[var(--teal)]', items: ['电池产业链完整自主', '成本控制能力全球领先', '政策支持与出口退税', '三电技术迭代速度快'] },
              { title: '主要短板', icon: '⚠', color: 'bg-yellow-500/10 border-yellow-500/20', textColor: 'text-yellow-400', items: ['品牌溢价低于德系/日系', '欧美高端渠道覆盖不足', '海外售后服务网络薄弱', '芯片/操作系统仍依赖进口'] },
              { title: '突围方向', icon: '→', color: 'bg-[rgba(0,194,255,0.08)] border-[rgba(0,194,255,0.2)]', textColor: 'text-[var(--cyan)]', items: ['技术授权模式提升附加值', '属地化建厂绕过关税壁垒', '差异化定位避开正面竞争', '数字化服务构建用户粘性'] },
            ].map((card) => (
              <div key={card.title} className={`rounded-lg border p-5 ${card.color}`}>
                <h4 className={`font-semibold ${card.textColor} mb-3 flex items-center gap-2`}>
                  <span>{card.icon}</span>
                  {card.title}
                </h4>
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${card.textColor.replace('text-', 'bg-')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 数据来源说明 ── */}
      <div className="ch-risk-bar rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-400">数据来源说明</p>
          <p className="text-sm text-amber-300 mt-1">
            当前展示为模拟数据，仅供界面框架验证。正式数据将接入
            海关总署月度公报、中汽协出口数据、UN Comtrade、ITC Trade Map 等数据源。
            单价与竞争力指标需接入海关 HS 编码级明细后自动切换至真实数据。
          </p>
        </div>
      </div>
    </div>
  )
}
