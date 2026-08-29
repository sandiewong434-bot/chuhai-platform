import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Car, Zap, TrendingUp, DollarSign,
  BarChart3, Target, Lightbulb, Globe,
  ChevronRight, CheckCircle2, XCircle, MinusCircle,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   M10 · 产品与市场选品 — NEV 全球热销格局 / 竞品对标 / 选品建议 / 区域适配
   ═══════════════════════════════════════════════════════════════ */

type TabKey = 'sales' | 'compare' | 'recommend' | 'fit'

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'sales', label: '热销格局', icon: BarChart3 },
  { key: 'compare', label: '竞品对标', icon: Target },
  { key: 'recommend', label: '选品建议', icon: Lightbulb },
  { key: 'fit', label: '区域适配', icon: Globe },
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

const PIE_COLORS = ['#00c2ff', '#3ce6b4', '#ffb020', '#a58bff', '#ff4d6d']

// ── KPI 数据 ──
const KPI_DATA = [
  { label: '全球热销NEV车型', value: '1,247', unit: '款', dot: 'cyan' as const, icon: Car },
  { label: '中国品牌海外在售', value: '186', unit: '款', dot: 'teal' as const, icon: Zap },
  { label: '目标市场TOP3品类', value: 'SUV / BEV / Sedan', unit: '', dot: 'amber' as const, icon: TrendingUp },
  { label: '价格敏感度最高区间', value: '$2-3.5万', unit: '', dot: 'danger' as const, icon: DollarSign },
]

// ── Tab ① 热销格局 ──
// 全球 NEV 车型销量 TOP15 (2025, 万辆)
const top15Models = [
  { name: 'Model Y', brand: '特斯拉', country: '美国', sales: 124.8, price: '$3.5-5万' },
  { name: 'Model 3', brand: '特斯拉', country: '美国', sales: 72.4, price: '$2.5-4万' },
  { name: '秦PLUS', brand: '比亚迪', country: '中国', sales: 58.6, price: '$1.2-1.8万' },
  { name: '宋PLUS', brand: '比亚迪', country: '中国', sales: 52.3, price: '$1.8-2.5万' },
  { name: '元PLUS', brand: '比亚迪', country: '中国', sales: 48.2, price: '$1.5-2.2万' },
  { name: '海鸥', brand: '比亚迪', country: '中国', sales: 45.6, price: '$0.9-1.3万' },
  { name: '海豚', brand: '比亚迪', country: '中国', sales: 38.4, price: '$1.2-1.6万' },
  { name: '五菱宏光MINI', brand: '上汽', country: '中国', sales: 35.2, price: '$0.5-0.8万' },
  { name: 'AION Y', brand: '广汽埃安', country: '中国', sales: 28.6, price: '$1.5-2万' },
  { name: 'ID.4', brand: '大众', country: '德国', sales: 24.8, price: '$3-4万' },
  { name: '理想L7', brand: '理想', country: '中国', sales: 22.4, price: '$4-5万' },
  { name: '极氪001', brand: '吉利', country: '中国', sales: 18.6, price: '$3.5-4.5万' },
  { name: '蔚来ES6', brand: '蔚来', country: '中国', sales: 15.2, price: '$4.5-6万' },
  { name: 'Mustang Mach-E', brand: '福特', country: '美国', sales: 14.8, price: '$3.5-5万' },
  { name: '宝马i4', brand: '宝马', country: '德国', sales: 12.4, price: '$5-7万' },
]

// 车身类型分布
const bodyTypeData = [
  { name: 'SUV', value: 42 },
  { name: 'Sedan', value: 31 },
  { name: 'Hatchback', value: 15 },
  { name: 'MPV', value: 8 },
  { name: 'Pickup', value: 4 },
]

// TOP10 表格数据
const top10Table = top15Models.slice(0, 10).map((m, i) => ({ ...m, rank: i + 1 }))

// ── Tab ② 竞品对标 ──
interface CompareRow {
  dimension: string
  chinese: { score: number; label: string; badge: 'advantage' | 'disadvantage' | 'neutral' }
  japanese: { score: number; label: string; badge: 'advantage' | 'disadvantage' | 'neutral' }
  german: { score: number; label: string; badge: 'advantage' | 'disadvantage' | 'neutral' }
  korean: { score: number; label: string; badge: 'advantage' | 'disadvantage' | 'neutral' }
}

const compareData: CompareRow[] = [
  {
    dimension: '价格竞争力',
    chinese: { score: 92, label: '$1.5-3万', badge: 'advantage' },
    japanese: { score: 65, label: '$2.5-4万', badge: 'disadvantage' },
    german: { score: 55, label: '$3.5-6万', badge: 'disadvantage' },
    korean: { score: 72, label: '$2-3.5万', badge: 'neutral' },
  },
  {
    dimension: '续航里程',
    chinese: { score: 85, label: '500-700km', badge: 'advantage' },
    japanese: { score: 58, label: '350-500km', badge: 'disadvantage' },
    german: { score: 78, label: '450-650km', badge: 'neutral' },
    korean: { score: 82, label: '480-700km', badge: 'neutral' },
  },
  {
    dimension: '快充速度',
    chinese: { score: 88, label: '800V 平台', badge: 'advantage' },
    japanese: { score: 52, label: '400V 平台', badge: 'disadvantage' },
    german: { score: 80, label: '800V 平台', badge: 'neutral' },
    korean: { score: 75, label: '400-800V', badge: 'neutral' },
  },
  {
    dimension: '智能化配置',
    chinese: { score: 90, label: 'L2+ / 智能座舱', badge: 'advantage' },
    japanese: { score: 55, label: 'L2 / 基础互联', badge: 'disadvantage' },
    german: { score: 72, label: 'L2+ / 座舱', badge: 'neutral' },
    korean: { score: 68, label: 'L2 / 座舱', badge: 'neutral' },
  },
  {
    dimension: '品牌认知度',
    chinese: { score: 62, label: '新兴市场高', badge: 'neutral' },
    japanese: { score: 88, label: '全球认可', badge: 'advantage' },
    german: { score: 92, label: '豪华品牌', badge: 'advantage' },
    korean: { score: 78, label: '区域强势', badge: 'neutral' },
  },
  {
    dimension: '本地化适配',
    chinese: { score: 75, label: '快速迭代', badge: 'neutral' },
    japanese: { score: 85, label: '深耕多年', badge: 'advantage' },
    german: { score: 82, label: '本地化强', badge: 'advantage' },
    korean: { score: 80, label: '区域适配', badge: 'neutral' },
  },
  {
    dimension: '供应链韧性',
    chinese: { score: 90, label: '垂直整合', badge: 'advantage' },
    japanese: { score: 72, label: '依赖进口', badge: 'neutral' },
    german: { score: 68, label: '部分依赖', badge: 'neutral' },
    korean: { score: 78, label: '电池自研', badge: 'neutral' },
  },
]

// ── Tab ③ 选品建议 ──
interface MarketRec {
  region: string
  flag: string
  bodyType: string
  powertrain: string
  priceRange: string
  keyFeatures: string[]
  hotModels: string[]
  color: string
}

const marketRecs: MarketRec[] = [
  {
    region: '欧洲',
    flag: '🇪🇺',
    bodyType: 'Sedan / Wagon',
    powertrain: 'BEV 为主',
    priceRange: '$2.5-4.5万',
    keyFeatures: ['WLTP续航>500km', 'CCS2快充', 'L2+辅助驾驶', 'OTA升级', 'V2G支持'],
    hotModels: ['Model 3', 'ID.7', '极氪001', '蔚来ET5'],
    color: '#00c2ff',
  },
  {
    region: '东南亚',
    flag: '🇹🇭',
    bodyType: 'Compact SUV / Hatchback',
    powertrain: 'BEV / PHEV',
    priceRange: '$1.5-2.5万',
    keyFeatures: ['高温环境适配', '右舵布局', '高湿度防护', '本地语言车机', '低成本维护'],
    hotModels: ['BYD Atto 3', '哪吒V', '五菱Air ev', 'AION Y'],
    color: '#3ce6b4',
  },
  {
    region: '拉美',
    flag: '🇧🇷',
    bodyType: 'SUV / Pickup',
    powertrain: 'BEV / 增程式',
    priceRange: '$2-3.5万',
    keyFeatures: ['大扭矩爬坡', '高离地间隙', '耐用悬架', '葡萄牙语车机', '本地服务网'],
    hotModels: ['BYD Song Plus', '长城哈弗H6', '奇瑞瑞虎8', '江淮JS4'],
    color: '#ffb020',
  },
  {
    region: '中东',
    flag: '🇸🇦',
    bodyType: 'Full-size SUV / Sedan',
    powertrain: 'BEV / 高端PHEV',
    priceRange: '$3-6万',
    keyFeatures: ['极端高温电池', '豪华内饰', '阿拉伯语车机', '高级辅助驾驶', '快充网络'],
    hotModels: ['红旗E-HS9', '蔚来ES8', '高合HiPhi X', '比亚迪汉'],
    color: '#a58bff',
  },
]

// ── Tab ④ 区域适配 ──
const fitModels = [
  '比亚迪海豹', '比亚迪元PLUS', '广汽埃安Y', '蔚来ET5', '小鹏G6',
  '极氪001', '理想L7', '长城欧拉好猫', '奇瑞QQ冰淇淋', '哪吒S',
]

const fitCountries = ['泰国', '印尼', '匈牙利', '西班牙', '巴西', '墨西哥', '沙特', '阿联酋', '澳大利亚', '土耳其']

// 生成适配度评分 (0-100)
const fitScores: number[][] = [
  [92, 78, 65, 82, 58, 72, 55, 68, 75, 62], // 比亚迪海豹
  [95, 88, 70, 75, 82, 85, 60, 72, 68, 70], // 比亚迪元PLUS
  [88, 75, 55, 68, 62, 78, 52, 58, 65, 55], // 广汽埃安Y
  [72, 58, 82, 88, 48, 55, 68, 75, 82, 65], // 蔚来ET5
  [78, 65, 62, 75, 55, 68, 58, 62, 70, 60], // 小鹏G6
  [68, 55, 85, 92, 52, 58, 62, 70, 88, 72], // 极氪001
  [62, 52, 58, 65, 48, 52, 55, 60, 58, 50], // 理想L7
  [85, 90, 48, 55, 75, 82, 45, 52, 55, 48], // 长城欧拉好猫
  [78, 82, 42, 48, 68, 75, 40, 48, 50, 45], // 奇瑞QQ冰淇淋
  [58, 48, 72, 78, 42, 48, 65, 72, 75, 58], // 哪吒S
]

// ── 辅助组件 ──

function Badge({ type, label }: { type: 'advantage' | 'disadvantage' | 'neutral'; label: string }) {
  const config = {
    advantage: { bg: 'bg-[rgba(60,230,180,0.12)]', text: 'text-[var(--teal)]', icon: CheckCircle2 },
    disadvantage: { bg: 'bg-[rgba(255,77,109,0.12)]', text: 'text-[var(--danger)]', icon: XCircle },
    neutral: { bg: 'bg-white/5', text: 'text-[var(--muted-text)]', icon: MinusCircle },
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

function FitScoreCell({ score }: { score: number }) {
  let color = '#ff4d6d'
  if (score >= 80) color = '#3ce6b4'
  else if (score >= 65) color = '#00c2ff'
  else if (score >= 50) color = '#ffb020'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-bold" style={{ color, textShadow: `0 0 8px ${color}44` }}>
        {score}
      </span>
      <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// ── 主组件 ──
export default function ProductSelection() {
  const [activeTab, setActiveTab] = useState<TabKey>('sales')

  // Tab ① BarChart 数据
  const barData = useMemo(() =>
    [...top15Models].sort((a, b) => a.sales - b.sales).map(m => ({
      name: m.name,
      sales: m.sales,
      brand: m.brand,
    }))
  , [])

  // 自定义 Tooltip
  const barTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="rounded-lg border border-[rgba(0,194,255,0.25)] bg-[rgba(10,26,43,0.95)] px-3 py-2 shadow-lg">
        <div className="text-sm font-bold text-white">{d.name}</div>
        <div className="text-xs text-[var(--muted-text)]">{d.brand}</div>
        <div className="mt-1 text-sm font-semibold text-[var(--cyan)]">{d.sales} 万辆</div>
      </div>
    )
  }

  const pieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="rounded-lg border border-[rgba(0,194,255,0.25)] bg-[rgba(10,26,43,0.95)] px-3 py-2 shadow-lg">
        <div className="text-sm font-bold text-white">{d.name}</div>
        <div className="mt-1 text-sm font-semibold" style={{ color: d.payload.fill }}>{d.value}%</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div className="flex items-center gap-2">
        <div className="ch-title-bar" />
        <div>
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[var(--cyan)]">Product Intelligence</div>
          <h2 className="text-xl font-bold text-white mt-0.5">产品与市场选品</h2>
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
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="ch-glow-num text-3xl text-white">{kpi.value}</span>
                {kpi.unit && <span className="text-xs text-[var(--muted-text)]">{kpi.unit}</span>}
              </div>
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
      {/* ① 热销格局                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Bar Chart */}
            <div className="lg:col-span-3 ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">全球 NEV 车型销量 TOP15</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">2025年 · 万辆</span>
                </div>
                <ResponsiveContainer width="100%" height={480}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
                    <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} tickFormatter={(v) => `${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={{ stroke: 'rgba(96,178,216,0.2)' }} width={80} />
                    <Tooltip content={barTooltip} cursor={{ fill: 'rgba(0,194,255,0.04)' }} />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={14}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={i >= barData.length - 3 ? COLORS.teal : COLORS.cyan} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="lg:col-span-2 space-y-4">
              <div className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="ch-title-bar" />
                    <h3 className="text-sm font-bold text-white">车身类型分布</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={bodyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {bodyTypeData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
                        ))}
                      </Pie>
                      <Tooltip content={pieTooltip} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span className="text-xs text-[var(--muted-text)]">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 类型说明 */}
              <div className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="ch-title-bar" />
                    <h3 className="text-sm font-bold text-white">类型洞察</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { text: 'SUV 占比最高 (42%)，是全球最畅销 NEV 车身类型', color: COLORS.cyan },
                      { text: 'Sedan (31%) 在亚太和欧洲市场仍有强劲需求', color: COLORS.teal },
                      { text: 'Hatchback (15%) 主要集中于欧洲和日本市场', color: COLORS.amber },
                      { text: 'MPV 和 Pickup 占比小但增长潜力大', color: COLORS.violet },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                        <span className="text-[var(--muted-text)]">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP10 Table */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">全球热销 TOP10 车型详情</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.15)]">
                      {['排名', '车型', '品牌', '国家', '2025销量(万辆)', '价格区间'].map((h) => (
                        <th key={h} className="text-left py-3 px-3 font-medium text-[var(--muted-text)] text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top10Table.map((row) => (
                      <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                            row.rank <= 3 ? 'bg-[rgba(0,194,255,0.15)] text-[var(--cyan)]' : 'text-[var(--muted-text)]'
                          }`}>
                            {String(row.rank).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">{row.name}</td>
                        <td className="py-2.5 px-3 text-[var(--muted-text)]">{row.brand}</td>
                        <td className="py-2.5 px-3 text-[var(--muted-text)]">{row.country}</td>
                        <td className="py-2.5 px-3">
                          <span className="ch-glow-num text-white">{row.sales}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--amber)]">{row.price}</td>
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
      {/* ② 竞品对标                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">中国品牌 vs 全球竞品 对标矩阵</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">数据来源: 2025年主流车型参数对比</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.15)]">
                      <th className="text-left py-3 px-3 font-medium text-[var(--muted-text)] text-xs">对比维度</th>
                      <th className="text-center py-3 px-3 font-medium text-[var(--cyan)] text-xs">中国品牌</th>
                      <th className="text-center py-3 px-3 font-medium text-[var(--muted-text)] text-xs">日本品牌</th>
                      <th className="text-center py-3 px-3 font-medium text-[var(--muted-text)] text-xs">德国品牌</th>
                      <th className="text-center py-3 px-3 font-medium text-[var(--muted-text)] text-xs">韩国品牌</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map((row) => (
                      <tr key={row.dimension} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-3 text-white font-medium">{row.dimension}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge type={row.chinese.badge} label={row.chinese.label} />
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--cyan)]" style={{ width: `${row.chinese.score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge type={row.japanese.badge} label={row.japanese.label} />
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--muted-text)]" style={{ width: `${row.japanese.score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge type={row.german.badge} label={row.german.label} />
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--muted-text)]" style={{ width: `${row.german.score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge type={row.korean.badge} label={row.korean.label} />
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--muted-text)]" style={{ width: `${row.korean.score}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 关键结论 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              { title: '中国品牌优势', items: ['极致性价比', '快充技术领先', '智能化配置丰富', '供应链垂直整合'], color: 'var(--teal)', border: 'rgba(60,230,180,0.2)' },
              { title: '核心差距', items: ['品牌溢价能力弱', '高端市场渗透率低', '售后服务网络待建', '本地化研发不足'], color: 'var(--danger)', border: 'rgba(255,77,109,0.2)' },
              { title: '突破方向', items: ['建立海外品牌认知', '加速本地化适配', '完善充电网络', '差异化产品定位'], color: 'var(--amber)', border: 'rgba(255,176,32,0.2)' },
            ].map((card) => (
              <div key={card.title} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4" style={{ borderLeft: `2px solid ${card.border}` }}>
                  <h4 className="text-sm font-bold mb-2" style={{ color: card.color }}>{card.title}</h4>
                  <div className="space-y-1.5">
                    {card.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--muted-text)]">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: card.color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 选品建议                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'recommend' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketRecs.map((market) => (
              <div key={market.region} className="ch-card-cut">
                <div className="ch-card-cut-inner p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{market.flag}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{market.region}市场</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--muted-text)]">推荐价位:</span>
                        <span className="text-xs font-semibold" style={{ color: market.color }}>{market.priceRange}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-white/5">
                      <div className="text-xs text-[var(--muted-text)] mb-1">推荐车身</div>
                      <div className="text-sm font-medium text-white">{market.bodyType}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5">
                      <div className="text-xs text-[var(--muted-text)] mb-1">动力形式</div>
                      <div className="text-sm font-medium text-white">{market.powertrain}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-[var(--muted-text)] mb-2">关键配置需求</div>
                    <div className="flex flex-wrap gap-1.5">
                      {market.keyFeatures.map((f) => (
                        <span key={f} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${market.color}18`, color: market.color, border: `1px solid ${market.color}33` }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--muted-text)] mb-2">热销对标车型</div>
                    <div className="flex flex-wrap gap-2">
                      {market.hotModels.map((m) => (
                        <span key={m} className="flex items-center gap-1 text-xs text-white bg-white/5 px-2 py-1 rounded">
                          <Car className="w-3 h-3 text-[var(--muted-text)]" />
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 选品策略总结 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">选品策略总结</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {[
                  { step: '1', title: '市场定位', desc: '根据目标市场梯队和竞争格局，确定价格带和产品定位', color: COLORS.cyan },
                  { step: '2', title: '品类选择', desc: '基于当地热销车型数据和消费者偏好，选定车身类型和动力形式', color: COLORS.teal },
                  { step: '3', title: '配置适配', desc: '针对气候、法规、充电基础设施调整关键配置和功能', color: COLORS.amber },
                  { step: '4', title: '定价策略', desc: '参考竞品定价和本地价格敏感度，制定有竞争力的价格策略', color: COLORS.violet },
                ].map((s) => (
                  <div key={s.step} className="p-3 rounded-lg bg-white/5 border border-[rgba(96,178,216,0.08)]">
                    <span className="text-lg font-bold" style={{ color: s.color }}>{s.step}</span>
                    <h4 className="text-sm font-medium text-white mt-1">{s.title}</h4>
                    <p className="text-xs text-[var(--muted-text)] mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 区域适配                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'fit' && (
        <div className="space-y-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">中国车型 × 目标市场 适配度矩阵</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">分数越高表示产品-市场匹配度越好</span>
              </div>

              {/* 图例 */}
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="text-[var(--muted-text)]">适配度:</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#3ce6b4' }} /> 优秀 (80-100)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#00c2ff' }} /> 良好 (65-79)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#ffb020' }} /> 一般 (50-64)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#ff4d6d' }} /> 待优化 (&lt;50)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.15)]">
                      <th className="text-left py-3 px-2 font-medium text-[var(--muted-text)] text-xs sticky left-0 bg-[#0a1a2b]">车型</th>
                      {fitCountries.map((c) => (
                        <th key={c} className="text-center py-3 px-2 font-medium text-[var(--muted-text)] text-xs min-w-[64px]">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fitModels.map((model, rowIdx) => (
                      <tr key={model} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-2.5 px-2 text-white font-medium text-xs sticky left-0 bg-[#0a1a2b] z-10">{model}</td>
                        {fitCountries.map((_, colIdx) => (
                          <td key={colIdx} className="py-2.5 px-2 text-center">
                            <FitScoreCell score={fitScores[rowIdx][colIdx]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 适配度分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              { title: '高适配车型-市场组合', items: ['比亚迪元PLUS × 泰国 (95)', '比亚迪元PLUS × 印尼 (88)', '极氪001 × 西班牙 (92)', '蔚来ET5 × 澳大利亚 (82)'], color: 'var(--teal)' },
              { title: '潜力组合 (需配置调整)', items: ['广汽埃安Y × 墨西哥 (78)', '小鹏G6 × 匈牙利 (62)', '比亚迪海豹 × 西班牙 (82)', '理想L7 × 沙特 (55)'], color: 'var(--cyan)' },
              { title: '低适配预警', items: ['奇瑞QQ冰淇淋 × 欧洲 (&lt;50)', '哪吒S × 拉美 (&lt;45)', '长城欧拉 × 中东 (&lt;50)', '需重新评估产品策略'], color: 'var(--danger)' },
            ].map((card) => (
              <div key={card.title} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: card.color }}>{card.title}</h4>
                  <div className="space-y-1.5">
                    {card.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--muted-text)]">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: card.color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 数据来源 ── */}
      <div className="ch-card-cut-sm">
        <div className="ch-card-cut-sm-inner p-3 text-xs text-[var(--muted-text)]">
          数据来源：MarkLines、IEA Global EV Outlook 2025、中汽协、各国汽车协会注册数据、企业公开参数；竞品对标基于 2025 年主流车型配置与价格信息综合整理。
        </div>
      </div>
    </div>
  )
}
