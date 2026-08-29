import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts'
import {
  Landmark, Factory, DollarSign, TrendingUp, ArrowDownRight,
  ArrowUpRight, Building2, Globe, Truck, ShoppingCart,
  CheckCircle2, XCircle, AlertCircle,
  Calculator, Settings2, Package,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   M8 · 进入模式与盈利测算 — NEV 出海进入策略 / 盈利模型 / 产能布局 / 税率渠道
   ═══════════════════════════════════════════════════════════════ */

type TabKey = 'compare' | 'profit' | 'capacity' | 'tax'

const TABS: { key: TabKey; label: string; icon: typeof Landmark }[] = [
  { key: 'compare', label: '模式对比', icon: Landmark },
  { key: 'profit', label: '盈利测算', icon: DollarSign },
  { key: 'capacity', label: '产能布局', icon: Factory },
  { key: 'tax', label: '税率渠道', icon: Calculator },
]

// ── 颜色常量 ──
const COLORS = {
  cyan: '#00c2ff',
  teal: '#3ce6b4',
  amber: '#ffb020',
  danger: '#ff4d6d',
  violet: '#a58bff',
  muted: '#809daf',
  grid: 'rgba(96,178,216,0.1)',
}

const BAR_COLORS = ['#00c2ff', '#3ce6b4', '#ffb020', '#a58bff', '#ff4d6d', '#ff8c42']

// ── KPI 数据 ──
const KPI_DATA = [
  { label: '平均建厂成本', value: '$8,500', unit: '/产能', dot: 'cyan' as const, icon: Factory, trend: '+5.2%', up: false },
  { label: '投资回收周期', value: '4.2', unit: '年', dot: 'teal' as const, icon: TrendingUp, trend: '-0.3年', up: true },
  { label: '海外产能利用率', value: '68', unit: '%', dot: 'amber' as const, icon: Settings2, trend: '+3.5%', up: true },
  { label: '单车平均毛利', value: '12.8', unit: '%', dot: 'violet' as const, icon: DollarSign, trend: '+1.2%', up: true },
]

// ═══════════════════════════════════════════════════════════════
// ① 模式对比
// ═══════════════════════════════════════════════════════════════

type ModeKey = 'WFOE' | 'JV' | 'BrandLicense' | 'CKD' | 'ExportDirect'

interface ModeRow {
  dimension: string
  weight?: string
  WFOE: { value: string; score: number; badge: 'good' | 'mid' | 'bad' }
  JV: { value: string; score: number; badge: 'good' | 'mid' | 'bad' }
  BrandLicense: { value: string; score: number; badge: 'good' | 'mid' | 'bad' }
  CKD: { value: string; score: number; badge: 'good' | 'mid' | 'bad' }
  ExportDirect: { value: string; score: number; badge: 'good' | 'mid' | 'bad' }
}

const modeCompareData: ModeRow[] = [
  {
    dimension: '初始投资额',
    weight: '高权重',
    WFOE: { value: '$5-15亿', score: 30, badge: 'bad' },
    JV: { value: '$2-8亿', score: 55, badge: 'mid' },
    BrandLicense: { value: '$0.1-0.5亿', score: 90, badge: 'good' },
    CKD: { value: '$0.5-2亿', score: 75, badge: 'good' },
    ExportDirect: { value: '$0.01-0.1亿', score: 95, badge: 'good' },
  },
  {
    dimension: '审批周期',
    weight: '',
    WFOE: { value: '18-36月', score: 40, badge: 'bad' },
    JV: { value: '12-24月', score: 60, badge: 'mid' },
    BrandLicense: { value: '3-6月', score: 90, badge: 'good' },
    CKD: { value: '6-12月', score: 75, badge: 'good' },
    ExportDirect: { value: '1-3月', score: 95, badge: 'good' },
  },
  {
    dimension: '综合税率',
    weight: '',
    WFOE: { value: '15-25%', score: 80, badge: 'good' },
    JV: { value: '15-25%', score: 80, badge: 'good' },
    BrandLicense: { value: '20-35%', score: 60, badge: 'mid' },
    CKD: { value: '10-20%', score: 85, badge: 'good' },
    ExportDirect: { value: '25-45%', score: 35, badge: 'bad' },
  },
  {
    dimension: '本地化要求',
    weight: '',
    WFOE: { value: '高(80%+)', score: 85, badge: 'good' },
    JV: { value: '中高(60%+)', score: 70, badge: 'mid' },
    BrandLicense: { value: '低', score: 40, badge: 'bad' },
    CKD: { value: '中(30-50%)', score: 65, badge: 'mid' },
    ExportDirect: { value: '无', score: 20, badge: 'bad' },
  },
  {
    dimension: '品牌控制力',
    weight: '',
    WFOE: { value: '完全控制', score: 95, badge: 'good' },
    JV: { value: '共享控制', score: 55, badge: 'mid' },
    BrandLicense: { value: '弱', score: 30, badge: 'bad' },
    CKD: { value: '较强', score: 75, badge: 'good' },
    ExportDirect: { value: '完全控制', score: 90, badge: 'good' },
  },
  {
    dimension: '风险等级',
    weight: '',
    WFOE: { value: '中', score: 65, badge: 'mid' },
    JV: { value: '中高', score: 45, badge: 'bad' },
    BrandLicense: { value: '低', score: 80, badge: 'good' },
    CKD: { value: '中低', score: 70, badge: 'mid' },
    ExportDirect: { value: '高(关税)', score: 35, badge: 'bad' },
  },
]

const modeSummary = [
  {
    key: 'WFOE' as ModeKey,
    title: 'WFOE 独资',
    subtitle: 'Wholly Foreign-Owned Enterprise',
    pros: ['完全品牌控制', '技术保密', '利润独享', '长期布局'],
    cons: ['投资额大', '审批周期长', '本地化压力', '政策风险'],
    color: COLORS.cyan,
    icon: Building2,
  },
  {
    key: 'JV' as ModeKey,
    title: 'Joint Venture 合资',
    subtitle: '与当地企业合作',
    pros: ['分担风险', '利用本地资源', '审批较快', '渠道共享'],
    cons: ['控制权争议', '技术泄露风险', '利润分配', '文化冲突'],
    color: COLORS.teal,
    icon: Factory,
  },
  {
    key: 'BrandLicense' as ModeKey,
    title: 'Brand License 品牌授权',
    subtitle: '轻资产模式',
    pros: ['极低投资', '快速扩张', '风险可控', '灵活退出'],
    cons: ['品牌控制力弱', '质量难控', '利润薄', '品牌稀释'],
    color: COLORS.amber,
    icon: ShoppingCart,
  },
  {
    key: 'CKD' as ModeKey,
    title: 'CKD/SKD 散件组装',
    subtitle: '半散装/全散装',
    pros: ['关税优惠', '本地化加分', '投资适中', '技术可控'],
    cons: ['物流复杂', '装配质量', '供应链长', '管理难度'],
    color: COLORS.violet,
    icon: Package,
  },
  {
    key: 'ExportDirect' as ModeKey,
    title: 'Direct Export 直接出口',
    subtitle: '整车出口',
    pros: ['零建厂投资', '最快启动', '完全控制', '灵活调拨'],
    cons: ['关税最高', '运输成本', '无本地化', '贸易壁垒敏感'],
    color: COLORS.danger,
    icon: Truck,
  },
]

// ═══════════════════════════════════════════════════════════════
// ② 盈利测算
// ═══════════════════════════════════════════════════════════════

// Waterfall chart data - single vehicle profit breakdown
const waterfallData = [
  { name: '整车售价', value: 35000, type: 'positive', fill: COLORS.teal },
  { name: '生产成本', value: -22000, type: 'negative', fill: COLORS.danger },
  { name: '关税/物流', value: -4200, type: 'negative', fill: COLORS.amber },
  { name: '销售费用', value: -2800, type: 'negative', fill: COLORS.amber },
  { name: '管理费用', value: -1500, type: 'negative', fill: COLORS.muted },
  { name: '单车毛利', value: 4500, type: 'total', fill: COLORS.cyan },
]

// Prepare waterfall with cumulative positions
function prepareWaterfall(data: typeof waterfallData) {
  let cumulative = 0
  return data.map((d) => {
    const prev = cumulative
    if (d.type === 'total') {
      cumulative = d.value
      return { ...d, start: 0, end: d.value }
    }
    const val = d.value
    cumulative += val
    return {
      ...d,
      start: val >= 0 ? prev : prev + val,
      end: val >= 0 ? prev + val : prev,
    }
  })
}

const regionProfitData = [
  { region: '东南亚', margin: 18.5, volume: 45 },
  { region: '拉美', margin: 14.2, volume: 32 },
  { region: '中东', margin: 22.8, volume: 18 },
  { region: '欧洲', margin: 8.5, volume: 28 },
  { region: '非洲', margin: 16.5, volume: 12 },
  { region: '澳洲', margin: 12.0, volume: 8 },
]

// ═══════════════════════════════════════════════════════════════
// ③ 产能布局
// ═══════════════════════════════════════════════════════════════

const factoryList = [
  { region: '东南亚', country: '泰国', oem: '比亚迪', investment: '$4.5亿', capacity: '15万辆', status: '已投产' as const, year: '2024' },
  { region: '东南亚', country: '泰国', oem: '长城', investment: '$2.2亿', capacity: '8万辆', status: '已投产' as const, year: '2024' },
  { region: '东南亚', country: '印尼', oem: '五菱', investment: '$1.5亿', capacity: '10万辆', status: '已投产' as const, year: '2023' },
  { region: '东南亚', country: '印尼', oem: '比亚迪', investment: '$3.2亿', capacity: '15万辆', status: '在建' as const, year: '2025' },
  { region: '欧洲', country: '匈牙利', oem: '比亚迪', investment: '$5.0亿', capacity: '20万辆', status: '在建' as const, year: '2025' },
  { region: '欧洲', country: '匈牙利', oem: '宁德时代', investment: '$7.3亿', capacity: '100GWh', status: '在建' as const, year: '2025' },
  { region: '欧洲', country: '西班牙', oem: '奇瑞', investment: '$2.0亿', capacity: '5万辆', status: '规划中' as const, year: '2026' },
  { region: '拉美', country: '巴西', oem: '比亚迪', investment: '$3.0亿', capacity: '15万辆', status: '已投产' as const, year: '2024' },
  { region: '拉美', country: '墨西哥', oem: '奇瑞', investment: '$1.5亿', capacity: '10万辆', status: '规划中' as const, year: '2026' },
  { region: '中东', country: '沙特', oem: '华人运通', investment: '$5.6亿', capacity: '5万辆', status: '在建' as const, year: '2025' },
  { region: '中东', country: '阿联酋', oem: '蔚来', investment: '$0.5亿', capacity: '0.5万辆', status: '规划中' as const, year: '2026' },
]

const capacityByRegion = [
  { region: '东南亚', 已投产: 33, 在建: 15, 规划中: 0 },
  { region: '欧洲', 已投产: 0, 在建: 20, 规划中: 5 },
  { region: '拉美', 已投产: 15, 在建: 0, 规划中: 10 },
  { region: '中东', 已投产: 0, 在建: 5, 规划中: 0.5 },
  { region: '非洲', 已投产: 0, 在建: 0, 规划中: 0 },
]

// ═══════════════════════════════════════════════════════════════
// ④ 税率渠道
// ═══════════════════════════════════════════════════════════════

const taxRateData = [
  { country: '泰国', effective: 20, corporate: 20, vat: 7, tariff: 0, note: 'BOI优惠' },
  { country: '印尼', effective: 22, corporate: 22, vat: 11, tariff: 0, note: '电动车免税' },
  { country: '匈牙利', effective: 9, corporate: 9, vat: 27, tariff: 0, note: '欧盟最低CIT' },
  { country: '西班牙', effective: 25, corporate: 25, vat: 21, tariff: 0, note: '无额外优惠' },
  { country: '巴西', effective: 34, corporate: 34, vat: 17, tariff: 0, note: '综合税率较高' },
  { country: '墨西哥', effective: 30, corporate: 30, vat: 16, tariff: 0, note: 'USMCA优惠' },
  { country: '沙特', effective: 20, corporate: 20, vat: 15, tariff: 5, note: 'GCC框架' },
  { country: '土耳其', effective: 25, corporate: 25, vat: 20, tariff: 10, note: 'EU关税同盟' },
]

const channelStructure = [
  {
    region: '东南亚',
    direct: 35, dealer: 55, online: 10,
    note: '经销商为主，直营快速扩张',
    color: COLORS.cyan,
  },
  {
    region: '欧洲',
    direct: 15, dealer: 70, online: 15,
    note: '传统经销商体系深厚',
    color: COLORS.teal,
  },
  {
    region: '拉美',
    direct: 20, dealer: 75, online: 5,
    note: '经销商垄断，线上渗透低',
    color: COLORS.amber,
  },
  {
    region: '中东',
    direct: 45, dealer: 45, online: 10,
    note: '高端直营+经销商并行',
    color: COLORS.violet,
  },
]

// ── 辅助组件 ──

function Badge({ type, label }: { type: 'good' | 'mid' | 'bad'; label: string }) {
  const config = {
    good: { bg: 'bg-[rgba(60,230,180,0.12)]', text: 'text-[var(--teal)]', icon: CheckCircle2 },
    mid: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertCircle },
    bad: { bg: 'bg-[rgba(255,77,109,0.12)]', text: 'text-[var(--danger)]', icon: XCircle },
  }
  const cfg = config[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: '已投产' | '在建' | '规划中' }) {
  const config = {
    已投产: { bg: 'bg-[rgba(60,230,180,0.12)]', text: 'text-[var(--teal)]', border: 'border-[rgba(60,230,180,0.2)]' },
    在建: { bg: 'bg-[rgba(0,194,255,0.12)]', text: 'text-[var(--cyan)]', border: 'border-[rgba(0,194,255,0.2)]' },
    规划中: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  }
  const cfg = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === '已投产' ? COLORS.teal : status === '在建' ? COLORS.cyan : COLORS.amber, boxShadow: `0 0 6px ${status === '已投产' ? COLORS.teal : status === '在建' ? COLORS.cyan : COLORS.amber}` }} />
      {status}
    </span>
  )
}

// ── 主组件 ──
export default function EntryMode() {
  const [activeTab, setActiveTab] = useState<TabKey>('compare')

  // Tab ② interactive params
  const [factoryCost, setFactoryCost] = useState(8500)
  const [laborCost, setLaborCost] = useState(1200)
  const [tariffRate, setTariffRate] = useState(15)

  const roiEstimate = useMemo(() => {
    // Simplified ROI: (revenue - cost) * volume / investment
    const unitPrice = 35000
    const unitCost = factoryCost + laborCost + 15000 // materials + other
    const tariffCost = unitPrice * (tariffRate / 100)
    const netProfit = unitPrice - unitCost - tariffCost - 3000 // sales/admin
    const annualVolume = 50000
    const investment = factoryCost * annualVolume * 0.3 // 30% of annual capacity cost as investment proxy
    const payback = investment / (netProfit * annualVolume)
    return { netProfit, payback: Math.max(1, payback * 12) } // months
  }, [factoryCost, laborCost, tariffRate])

  const wfData = useMemo(() => prepareWaterfall(waterfallData), [])

  const wfTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-[rgba(0,194,255,0.25)] bg-[rgba(10,26,43,0.95)] px-3 py-2 shadow-lg">
        <div className="text-sm font-bold text-white">{d.name}</div>
        <div className={`mt-1 text-sm font-semibold ${d.type === 'negative' ? 'text-[var(--danger)]' : d.type === 'total' ? 'text-[var(--cyan)]' : 'text-[var(--teal)]'}`}>
          {d.type === 'negative' ? '' : d.type === 'total' ? '毛利: ' : ''}
          {d.value >= 0 ? `$${d.value.toLocaleString()}` : `-$${Math.abs(d.value).toLocaleString()}`}
        </div>
      </div>
    )
  }

  const profitTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-[rgba(0,194,255,0.25)] bg-[rgba(10,26,43,0.95)] px-3 py-2 shadow-lg">
        <div className="text-sm font-bold text-white">{d.region}</div>
        <div className="mt-1 text-sm font-semibold text-[var(--cyan)]">利润率: {d.margin}%</div>
        <div className="text-xs text-[var(--muted-text)]">年销量: {d.volume}万辆</div>
      </div>
    )
  }

  // Tab ③ status counts
  const statusCounts = useMemo(() => {
    const counts = { 已投产: 0, 在建: 0, 规划中: 0 }
    factoryList.forEach((f) => { counts[f.status]++ })
    return counts
  }, [])

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div className="flex items-center gap-2">
        <div className="ch-title-bar" />
        <div>
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[var(--cyan)]">Entry Strategy</div>
          <h2 className="text-xl font-bold text-white mt-0.5">进入模式与盈利测算</h2>
        </div>
      </div>

      {/* ── KPI 卡片 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className={`ch-dot ch-dot-${kpi.dot} rounded-full`} style={{ width: 6, height: 6 }} />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
                {kpi.up ? (
                  <ArrowUpRight className="w-3 h-3 text-[var(--teal)] ml-auto" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-[var(--danger)] ml-auto" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="ch-glow-num text-3xl text-white">{kpi.value}</span>
                {kpi.unit && <span className="text-xs text-[var(--muted-text)]">{kpi.unit}</span>}
              </div>
              <span className={`text-xs mt-1 ${kpi.up ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                {kpi.trend}
              </span>
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
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'border-[var(--cyan)] text-[var(--cyan)] shadow-[0_0_12px_rgba(0,194,255,0.15)]'
                : 'border-transparent text-[var(--muted-text)] hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ① 模式对比                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {/* 对比矩阵表 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">五种进入模式综合对比矩阵</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">评分越高代表该维度越有优势</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.15)]">
                      <th className="text-left py-3 px-3 font-medium text-[var(--muted-text)] text-xs">对比维度</th>
                      {['WFOE\n独资', 'JV\n合资', 'Brand License\n品牌授权', 'CKD/SKD\n散件组装', 'Direct Export\n直接出口'].map((h, i) => (
                        <th key={i} className="text-center py-3 px-2 font-medium text-[var(--cyan)] text-xs whitespace-pre-line">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modeCompareData.map((row) => (
                      <tr key={row.dimension} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-3 text-white font-medium">
                          {row.dimension}
                          {row.weight && <span className="text-[10px] text-[var(--muted-text)] ml-1">({row.weight})</span>}
                        </td>
                        {(Object.keys(row) as Array<keyof ModeRow>).filter((k) => k !== 'dimension' && k !== 'weight').map((modeKey) => {
                          const cell = row[modeKey]
                          return (
                            <td key={modeKey} className="py-3 px-2 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <Badge type={cell.badge} label={cell.value} />
                                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${cell.score}%`,
                                      background: cell.score >= 80 ? COLORS.teal : cell.score >= 55 ? COLORS.amber : COLORS.danger,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 各模式优劣势卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {modeSummary.map((mode) => (
              <div key={mode.key} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ background: `${mode.color}18`, border: `1px solid ${mode.color}33` }}>
                      <mode.icon className="w-4 h-4" style={{ color: mode.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{mode.title}</h4>
                      <p className="text-[10px] text-[var(--muted-text)]">{mode.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-medium text-[var(--teal)] mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />优势
                      </div>
                      <div className="space-y-1">
                        {mode.pros.map((p) => (
                          <div key={p} className="flex items-center gap-1.5 text-xs text-[var(--muted-text)]">
                            <span className="w-1 h-1 rounded-full bg-[var(--teal)]" />
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-[var(--danger)] mb-1.5 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />劣势
                      </div>
                      <div className="space-y-1">
                        {mode.cons.map((c) => (
                          <div key={c} className="flex items-center gap-1.5 text-xs text-[var(--muted-text)]">
                            <span className="w-1 h-1 rounded-full bg-[var(--danger)]" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 盈利测算                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'profit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Waterfall Chart */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">单车利润瀑布图</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">单位: USD</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={wfData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid stroke={COLORS.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={wfTooltip} cursor={{ fill: 'rgba(0,194,255,0.04)' }} />
                    <Bar dataKey="end" radius={[4, 4, 0, 0]} barSize={40}>
                      {wfData.map((d, i) => (
                        <Cell key={i} fill={d.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--muted-text)]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: COLORS.teal }} />收入</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: COLORS.danger }} />成本</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: COLORS.cyan }} />毛利</span>
                </div>
              </div>
            </div>

            {/* Regional Profit Margin */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">区域利润率对比</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">2025年预估</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={regionProfitData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid stroke={COLORS.grid} vertical={false} />
                    <XAxis dataKey="region" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={profitTooltip} cursor={{ fill: 'rgba(0,194,255,0.04)' }} />
                    <Bar dataKey="margin" radius={[4, 4, 0, 0]} barSize={32}>
                      {regionProfitData.map((_d, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Parameter Cards + ROI Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 参数调整 */}
            <div className="lg:col-span-2 ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">盈利敏感性参数调整</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">实时测算</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <label className="text-xs text-[var(--muted-text)] mb-2 block">单车建厂摊销 ($)</label>
                    <input
                      type="range"
                      min={3000}
                      max={15000}
                      step={100}
                      value={factoryCost}
                      onChange={(e) => setFactoryCost(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)]"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--muted-text)]">$3k</span>
                      <span className="ch-glow-num text-white">${factoryCost.toLocaleString()}</span>
                      <span className="text-xs text-[var(--muted-text)]">$15k</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <label className="text-xs text-[var(--muted-text)] mb-2 block">单车人工及其他 ($)</label>
                    <input
                      type="range"
                      min={500}
                      max={3000}
                      step={50}
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full accent-[var(--teal)]"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--muted-text)]">$500</span>
                      <span className="ch-glow-num text-white">${laborCost.toLocaleString()}</span>
                      <span className="text-xs text-[var(--muted-text)]">$3k</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <label className="text-xs text-[var(--muted-text)] mb-2 block">关税税率 (%)</label>
                    <input
                      type="range"
                      min={0}
                      max={45}
                      step={1}
                      value={tariffRate}
                      onChange={(e) => setTariffRate(Number(e.target.value))}
                      className="w-full accent-[var(--amber)]"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--muted-text)]">0%</span>
                      <span className="ch-glow-num text-white">{tariffRate}%</span>
                      <span className="text-xs text-[var(--muted-text)]">45%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Calculator Result */}
            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-[var(--cyan)]" />
                  <h3 className="text-sm font-bold text-white">ROI 快速测算</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xs text-[var(--muted-text)]">单车净利润</div>
                    <div className={`text-xl font-bold ch-glow-num ${roiEstimate.netProfit >= 0 ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                      ${roiEstimate.netProfit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xs text-[var(--muted-text)]">投资回收期</div>
                    <div className="text-xl font-bold text-white ch-glow-num">
                      {roiEstimate.payback.toFixed(1)} <span className="text-sm text-[var(--muted-text)]">个月</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-xs text-[var(--muted-text)]">年化 ROI</div>
                    <div className="text-xl font-bold text-[var(--cyan)] ch-glow-num">
                      {((1 / (roiEstimate.payback / 12)) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--muted-text)] mt-3">
                  *基于年产能5万辆假设，结果仅供参考
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 产能布局                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'capacity' && (
        <div className="space-y-4">
          {/* 状态统计卡片 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '已投产', value: statusCounts.已投产, color: COLORS.teal, icon: CheckCircle2 },
              { label: '在建', value: statusCounts.在建, color: COLORS.cyan, icon: Factory },
              { label: '规划中', value: statusCounts.规划中, color: COLORS.amber, icon: AlertCircle },
            ].map((s) => (
              <div key={s.label} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md" style={{ background: `${s.color}18` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <span className="text-xs text-[var(--muted-text)]">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-white ch-glow-num">{s.value}</p>
                    <span className="text-xs text-[var(--muted-text)]">个项目</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 工厂列表 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">中国 OEM 海外工厂清单</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">{factoryList.length} 个项目</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(96,178,216,0.15)]">
                        {['区域', '国家', 'OEM', '投资额', '产能', '状态', '预计'].map((h) => (
                          <th key={h} className="text-left py-2.5 px-2 font-medium text-[var(--muted-text)] text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {factoryList.map((row, idx) => (
                        <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                          <td className="py-2 px-2 text-[var(--muted-text)] text-xs">{row.region}</td>
                          <td className="py-2 px-2 text-white font-medium text-xs">{row.country}</td>
                          <td className="py-2 px-2 text-[var(--cyan)] text-xs">{row.oem}</td>
                          <td className="py-2 px-2 text-white text-xs">{row.investment}</td>
                          <td className="py-2 px-2 text-white text-xs">{row.capacity}</td>
                          <td className="py-2 px-2"><StatusBadge status={row.status} /></td>
                          <td className="py-2 px-2 text-[var(--muted-text)] text-xs">{row.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 产能堆叠图 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">区域产能分布 (万辆)</h3>
                </div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={capacityByRegion} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid stroke={COLORS.grid} vertical={false} />
                    <XAxis dataKey="region" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} />
                    <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1a2b', borderColor: 'rgba(96,178,216,0.15)', color: '#eaf8ff' }}
                      formatter={(value: number, name: string) => [`${value}万辆`, name]}
                    />
                    <Legend formatter={(value: string) => <span className="text-xs text-[var(--muted-text)]">{value}</span>} />
                    <Bar dataKey="已投产" stackId="a" fill={COLORS.teal} fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="在建" stackId="a" fill={COLORS.cyan} fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="规划中" stackId="a" fill={COLORS.amber} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 税率渠道                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 税率对比表 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">各国有效税率对比</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">2025年数据</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(96,178,216,0.15)]">
                        {['国家', '有效税率', '企业所得税', 'VAT', '关税', '备注'].map((h) => (
                          <th key={h} className="text-left py-2.5 px-2 font-medium text-[var(--muted-text)] text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {taxRateData.map((row) => (
                        <tr key={row.country} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                          <td className="py-2 px-2 text-white font-medium text-xs">{row.country}</td>
                          <td className="py-2 px-2">
                            <span className="ch-glow-num text-white text-xs">{row.effective}%</span>
                          </td>
                          <td className="py-2 px-2 text-[var(--muted-text)] text-xs">{row.corporate}%</td>
                          <td className="py-2 px-2 text-[var(--muted-text)] text-xs">{row.vat}%</td>
                          <td className="py-2 px-2 text-[var(--muted-text)] text-xs">{row.tariff}%</td>
                          <td className="py-2 px-2 text-[var(--amber)] text-xs">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 税率对比图 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">有效税率可视化</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taxRateData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                    <XAxis type="number" domain={[0, 40]} tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="country" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1a2b', borderColor: 'rgba(96,178,216,0.15)', color: '#eaf8ff' }}
                      formatter={(value: number) => [`${value}%`, '有效税率']}
                    />
                    <Bar dataKey="effective" radius={[0, 4, 4, 0]} barSize={16}>
                      {taxRateData.map((d, i) => (
                        <Cell key={i} fill={d.effective <= 15 ? COLORS.teal : d.effective <= 25 ? COLORS.cyan : COLORS.danger} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 渠道结构卡片 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">区域渠道结构: Direct vs Dealer vs Online</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {channelStructure.map((ch) => (
                  <div key={ch.region} className="p-3 rounded-lg bg-white/5 border border-[rgba(96,178,216,0.08)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5" style={{ color: ch.color }} />
                      <h4 className="text-sm font-bold text-white">{ch.region}</h4>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--muted-text)]">直营 Direct</span>
                          <span className="text-white font-medium">{ch.direct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--cyan)]" style={{ width: `${ch.direct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--muted-text)]">经销商 Dealer</span>
                          <span className="text-white font-medium">{ch.dealer}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${ch.dealer}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--muted-text)]">线上 Online</span>
                          <span className="text-white font-medium">{ch.online}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--amber)]" style={{ width: `${ch.online}%` }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--muted-text)] mt-2">{ch.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 数据来源 ── */}
      <div className="ch-card-cut-sm">
        <div className="ch-card-cut-sm-inner p-3 text-xs text-[var(--muted-text)]">
          数据来源：各 OEM 官方公告、MarkLines、各国投资促进机构、OICA、WTO关税数据库、Deloitte Tax Guides 2025；渠道数据基于公开研报与行业访谈综合估算。
        </div>
      </div>
    </div>
  )
}
