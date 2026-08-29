import { useState } from 'react'
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
  Legend,
} from 'recharts'
import {
  Cpu,
  Handshake,
  FileCheck,
  Globe2,
  Layers,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  Scale,
  Award,
  AlertCircle,
} from 'lucide-react'

// ── 类型 ──
type TabKey = 'scale' | 'network' | 'field' | 'license'

// ── Tab 配置 ──
const TABS: { key: TabKey; label: string; icon: typeof Cpu }[] = [
  { key: 'scale', label: '规模与结构', icon: Layers },
  { key: 'network', label: '合作网络', icon: Globe2 },
  { key: 'field', label: '领域分布', icon: Handshake },
  { key: 'license', label: '授权条款', icon: FileCheck },
]

// ═══════════════════════════════════════════════════════════════
// 数据定义
// ═══════════════════════════════════════════════════════════════

// ① 规模与结构
const agreementTrend = [
  { year: '2020', count: 28, amount: 35 },
  { year: '2021', count: 38, amount: 52 },
  { year: '2022', count: 52, amount: 78 },
  { year: '2023', count: 68, amount: 96 },
  { year: '2024', count: 76, amount: 112 },
  { year: '2025(预)', count: 84, amount: 126 },
]

const modelDistribution = [
  { name: '平台授权', value: 22, color: '#3b82f6' },
  { name: '联合开发', value: 18, color: '#10b981' },
  { name: '技术许可', value: 20, color: '#f59e0b' },
  { name: '合资研发', value: 15, color: '#8b5cf6' },
  { name: '供应链协同', value: 9, color: '#ef4444' },
]

const modelAmountEvolution = [
  { year: '2021', 平台授权: 15, 联合开发: 12, 技术许可: 14, 合资研发: 8, 供应链协同: 3 },
  { year: '2022', 平台授权: 18, 联合开发: 14, 技术许可: 16, 合资研发: 10, 供应链协同: 5 },
  { year: '2023', 平台授权: 20, 联合开发: 18, 技术许可: 19, 合资研发: 12, 供应链协同: 6 },
  { year: '2024', 平台授权: 22, 联合开发: 20, 技术许可: 21, 合资研发: 14, 供应链协同: 8 },
  { year: '2025(预)', 平台授权: 25, 联合开发: 22, 技术许可: 24, 合资研发: 16, 供应链协同: 9 },
]

// ② 合作网络
const topPartners = [
  { rank: 1, company: 'Toyota', country: '日本', type: '联合开发', field: '整车平台', amount: '$28亿', status: '进行中' },
  { rank: 2, company: 'Ford', country: '美国', type: '技术许可', field: '电池', amount: '$18亿', status: '进行中' },
  { rank: 3, company: 'Stellantis', country: '荷兰', type: '平台授权', field: '整车平台', amount: '$15亿', status: '签约' },
  { rank: 4, company: 'Hyundai', country: '韩国', type: '合资研发', field: '电驱', amount: '$12亿', status: '进行中' },
  { rank: 5, company: 'Mercedes-Benz', country: '德国', type: '联合开发', field: '智能座舱', amount: '$10亿', status: '进行中' },
  { rank: 6, company: 'VW Group', country: '德国', type: '平台授权', field: '整车平台', amount: '$9亿', status: '签约' },
  { rank: 7, company: 'Renault', country: '法国', type: '技术许可', field: '电驱', amount: '$8亿', status: '进行中' },
  { rank: 8, company: 'BMW', country: '德国', type: '联合开发', field: '自动驾驶', amount: '$7亿', status: '谈判中' },
  { rank: 9, company: 'Nissan', country: '日本', type: '供应链协同', field: '电池', amount: '$6亿', status: '进行中' },
  { rank: 10, company: 'Volvo', country: '瑞典', type: '平台授权', field: '整车平台', amount: '$5.5亿', status: '签约' },
  { rank: 11, company: 'Jaguar Land Rover', country: '英国', type: '技术许可', field: '电驱', amount: '$5亿', status: '签约' },
  { rank: 12, company: 'Mazda', country: '日本', type: '联合开发', field: '整车平台', amount: '$4.5亿', status: '谈判中' },
  { rank: 13, company: 'Suzuki', country: '日本', type: '供应链协同', field: '智能座舱', amount: '$3.5亿', status: '进行中' },
  { rank: 14, company: 'Tata Motors', country: '印度', type: '平台授权', field: '整车平台', amount: '$3亿', status: '签约' },
  { rank: 15, company: 'VinFast', country: '越南', type: '技术许可', field: '电池', amount: '$2.5亿', status: '进行中' },
]

const keyPartnerships = [
  {
    title: 'BYD × Toyota',
    type: '联合开发',
    desc: '基于e平台3.0联合开发纯电车型，面向全球市场',
    amount: '$28亿',
    year: '2023-2030',
    highlight: '全球首款合资纯电平台',
  },
  {
    title: 'CATL × Ford',
    type: '技术许可',
    desc: '磷酸铁锂电池技术授权，供应北美电动皮卡/SUV',
    amount: '$18亿',
    year: '2024-2029',
    highlight: '北美首个LFP电池本土化',
  },
  {
    title: 'Xpeng × VW',
    type: '平台授权',
    desc: 'SSP平台技术授权，联合开发两款纯电车型',
    amount: '$7亿',
    year: '2024-2026',
    highlight: '中国智驾技术反向输出',
  },
  {
    title: 'Gotion × InoBat',
    type: '合资研发',
    desc: '欧洲电池合资工厂，产能40GWh',
    amount: '$12亿',
    year: '2025-2028',
    highlight: '中欧电池技术桥头堡',
  },
]

// ③ 领域分布
const fieldDistribution = [
  { field: '整车平台', count: 28, amount: 45 },
  { field: '电池', count: 22, amount: 38 },
  { field: '电驱', count: 16, amount: 22 },
  { field: '智能座舱', count: 12, amount: 15 },
  { field: '自动驾驶', count: 6, amount: 6 },
]

const fieldTrend = [
  { year: '2021', 整车平台: 12, 电池: 8, 电驱: 5, 智能座舱: 3, 自动驾驶: 1 },
  { year: '2022', 整车平台: 16, 电池: 11, 电驱: 7, 智能座舱: 5, 自动驾驶: 2 },
  { year: '2023', 整车平台: 22, 电池: 15, 电驱: 10, 智能座舱: 7, 自动驾驶: 3 },
  { year: '2024', 整车平台: 26, 电池: 20, 电驱: 14, 智能座舱: 10, 自动驾驶: 5 },
  { year: '2025(预)', 整车平台: 28, 电池: 22, 电驱: 16, 智能座舱: 12, 自动驾驶: 6 },
]

const fieldCases = [
  {
    field: '整车平台',
    caseTitle: '比亚迪 e平台3.0 授权 Toyota',
    desc: '向丰田授权纯电平台技术，联合开发bZ系列后续车型，覆盖亚太及欧洲市场',
    partners: 'Toyota, Stellantis, VW',
  },
  {
    field: '电池',
    caseTitle: '宁德时代 LFP 技术授权 Ford',
    desc: '福特获得磷酸铁锂电池专利授权，在密歇根州建设35GWh电池工厂',
    partners: 'Ford, Tesla, BMW',
  },
  {
    field: '电驱',
    caseTitle: '汇川技术 电驱系统出口欧洲',
    desc: '向雷诺、捷豹路虎供应800V高压电驱平台，功率密度达4.5kW/kg',
    partners: 'Renault, JLR, Hyundai',
  },
  {
    field: '智能座舱',
    caseTitle: '华为 HarmonyOS 座舱出海',
    desc: '鸿蒙座舱系统授权东南亚车企，集成语音助手、导航及OTA能力',
    partners: 'Suzuki, 东南亚车企',
  },
  {
    field: '自动驾驶',
    caseTitle: '小鹏 XNGP 技术授权 VW',
    desc: '大众集团投资7亿美元获得小鹏G9平台及智驾系统授权',
    partners: 'VW Group, BMW',
  },
]

// ④ 授权条款
const licenseTerms = [
  {
    agreement: 'BYD-Toyota 平台授权',
    fee: '$5亿 upfront + $2000/车',
    term: '7年',
    scope: '亚太+欧洲',
    cobrand: '是',
    secrecy: '5年',
  },
  {
    agreement: 'CATL-Ford 技术许可',
    fee: '$3亿 upfront + 3% royalty',
    term: '5年',
    scope: '北美',
    cobrand: '否',
    secrecy: '7年',
  },
  {
    agreement: 'Xpeng-VW 平台授权',
    fee: '$2亿 upfront',
    term: '3年',
    scope: '全球',
    cobrand: '是',
    secrecy: '3年',
  },
  {
    agreement: 'Gotion-InoBat 合资',
    fee: '按股权分摊',
    term: '10年',
    scope: '欧洲',
    cobrand: '否',
    secrecy: '10年',
  },
  {
    agreement: '蔚来-长安 换电授权',
    fee: '$1亿 upfront + 服务费',
    term: '5年',
    scope: '中国+海外',
    cobrand: '是',
    secrecy: '5年',
  },
  {
    agreement: '比亚迪-丰田 电池供应',
    fee: '长期供货协议',
    term: '8年',
    scope: '全球',
    cobrand: '否',
    secrecy: '3年',
  },
]

// 图表统一配色
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export default function TechCooperation() {
  const [activeTab, setActiveTab] = useState<TabKey>('scale')

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] tracking-wider uppercase">
            Technology Cooperation
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">技术合作与标准输出</h2>
        <p className="text-[var(--muted-text)] mt-1">
          M5 模块 · 中国 NEV 核心技术全球授权与合资合作全景
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '技术授权协议', value: '84', unit: '份', icon: FileCheck, sub: '同比 +10.5%', color: 'ch-dot' },
          { label: '合作涉及金额', value: '$126', unit: '亿', icon: DollarSign, sub: '累计签约金额', color: 'ch-dot ch-dot-teal' },
          { label: '标准输出国家', value: '38', unit: '个', icon: Globe2, sub: '覆盖五大洲', color: 'ch-dot ch-dot-amber' },
          { label: '合资研发中心', value: '24', unit: '个', icon: Users, sub: '海外本土研发', color: 'ch-dot ch-dot-danger' },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={kpi.color} />
                  <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
                </div>
                <kpi.icon className="w-4 h-4 text-[var(--muted-text)]" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white ch-glow-num">{kpi.value}</span>
                <span className="text-sm text-[var(--muted-text)]">{kpi.unit}</span>
              </div>
              <p className="text-xs mt-1 text-[var(--muted-text)]">{kpi.sub}</p>
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
      {/* ① 规模与结构                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'scale' && (
        <div className="space-y-6">
          {/* 协议数量趋势 + 合作模式饼图 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">
                    2020-2025 技术合作协议数量趋势
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={agreementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }}
                    />
                    <Bar dataKey="count" name="协议数量(份)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-[var(--muted-text)] mt-3">
                  2020-2025 年技术合作协议数量从 28 份增长至 84 份，年均复合增长率 +24.6%
                </p>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">合作模式分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: any) => `${name}: ${value}份`}
                    >
                      {modelDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value: string) => <span className="text-xs text-[var(--muted-text)]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 各模式金额占比演变 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">各合作模式金额占比演变（亿美元）</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={modelAmountEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }}
                  />
                  <Legend
                    iconType="rect"
                    formatter={(value: string) => <span className="text-xs text-[var(--muted-text)]">{value}</span>}
                  />
                  <Bar dataKey="平台授权" stackId="a" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="联合开发" stackId="a" fill={CHART_COLORS[1]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="技术许可" stackId="a" fill={CHART_COLORS[2]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="合资研发" stackId="a" fill={CHART_COLORS[3]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="供应链协同" stackId="a" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-[var(--muted-text)] mt-3">
                平台授权与技术许可为主要金额贡献模式，2025年合计占比约 69%；合资研发金额增速最快，同比 +28%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 合作网络                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          {/* 关键合作卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyPartnerships.map((p) => (
              <div key={p.title} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--cyan)]">{p.type}</span>
                    <span className="text-xs text-[var(--muted-text)]">{p.year}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{p.title}</h4>
                  <p className="text-xs text-[var(--muted-text)] mb-3 line-clamp-2">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white ch-glow-num">{p.amount}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(60,230,180,0.12)] text-[var(--teal)] border border-[rgba(60,230,180,0.2)]">
                      {p.highlight}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOP15 合作伙伴表格 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">主要合作伙伴 TOP15</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">排名</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">企业</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">国家</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">合作类型</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">领域</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">金额</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPartners.map((row) => (
                      <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.rank}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.company}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.country}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] border border-[rgba(0,194,255,0.15)]">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.field}</td>
                        <td className="py-3 px-4 text-right font-semibold text-white">{row.amount}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === '进行中'
                              ? 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)] border border-[rgba(60,230,180,0.15)]'
                              : row.status === '签约'
                              ? 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] border border-[rgba(0,194,255,0.15)]'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 网络关系描述 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">合作网络特征分析</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: '日韩系', count: '5家', share: '33%', desc: 'Toyota、Nissan、Mazda 等以联合开发为主，聚焦整车平台与电池', color: 'text-[var(--cyan)]', bg: 'bg-[rgba(0,194,255,0.08)]', border: 'border-[rgba(0,194,255,0.2)]' },
                  { title: '欧系', count: '6家', share: '40%', desc: 'VW、Benz、BMW 等以平台授权和技术许可为主，金额占比最高', color: 'text-[var(--teal)]', bg: 'bg-[rgba(60,230,180,0.08)]', border: 'border-[rgba(60,230,180,0.2)]' },
                  { title: '美系+其他', count: '4家', share: '27%', desc: 'Ford、Stellantis 以电池和平台技术引进为主，北美市场为核心', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                ].map((g) => (
                  <div key={g.title} className={`rounded-lg border p-4 ${g.bg} ${g.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${g.color}`}>{g.title}车企</h4>
                      <span className="text-xs text-[var(--muted-text)]">{g.count}</span>
                    </div>
                    <div className="text-2xl font-bold text-white ch-glow-num mb-2">{g.share}</div>
                    <p className="text-xs text-[var(--muted-text)]">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 领域分布                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'field' && (
        <div className="space-y-6">
          {/* 领域分布 + 年度趋势 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">合作领域分布</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fieldDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis dataKey="field" type="category" width={80} tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }}
                    />
                    <Bar dataKey="count" name="合作数量(个)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="ch-title-bar" />
                  <h3 className="text-lg font-semibold text-white">各领域合作数量年度趋势</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={fieldTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#809daf' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }}
                    />
                    <Legend
                      iconType="line"
                      formatter={(value: string) => <span className="text-xs text-[var(--muted-text)]">{value}</span>}
                    />
                    <Line type="monotone" dataKey="整车平台" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="电池" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="电驱" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="智能座舱" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="自动驾驶" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 各领域头部案例 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">各领域头部案例</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldCases.map((c) => (
                  <div key={c.field} className="rounded-lg border border-[rgba(96,178,216,0.12)] bg-white/5 p-4 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="ch-dot" />
                      <span className="text-xs font-medium text-[var(--cyan)]">{c.field}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{c.caseTitle}</h4>
                    <p className="text-xs text-[var(--muted-text)] mb-3 line-clamp-3">{c.desc}</p>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-[var(--muted-text)]" />
                      <span className="text-[10px] text-[var(--muted-text)]">{c.partners}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 授权条款                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          {/* 摘要卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: '平均授权费', value: '$2.8亿', sub: ' upfront + royalty', icon: DollarSign, color: 'ch-dot' },
              { label: '平均授权期限', value: '5.8年', sub: '中位数 6年', icon: Clock, color: 'ch-dot ch-dot-teal' },
              { label: '联合品牌占比', value: '42%', sub: '18/42 项协议', icon: Award, color: 'ch-dot ch-dot-amber' },
            ].map((kpi) => (
              <div key={kpi.label} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={kpi.color} />
                    <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white ch-glow-num">{kpi.value}</div>
                  <p className="text-xs text-[var(--muted-text)] mt-1">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 授权条款对比表 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">授权条款对比分析</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">合作协议</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">授权费结构</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">期限</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">范围</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">联合品牌</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--muted-text)]">技术保密</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenseTerms.map((row, idx) => (
                      <tr key={idx} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.agreement}</td>
                        <td className="py-3 px-4 text-[var(--muted-text)]">{row.fee}</td>
                        <td className="py-3 px-4 text-center text-white">{row.term}</td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.scope}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.cobrand === '是'
                              ? 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)] border border-[rgba(60,230,180,0.15)]'
                              : 'bg-white/5 text-[var(--muted-text)] border border-[rgba(96,178,216,0.1)]'
                          }`}>
                            {row.cobrand}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[var(--muted-text)]">{row.secrecy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 条款特征总结 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '授权费模式', icon: Scale, color: 'text-[var(--cyan)]', bg: 'bg-[rgba(0,194,255,0.08)]', border: 'border-[rgba(0,194,255,0.2)]', items: [' upfront 预付金为主流', 'Royalty 按量提成占比 35%', '联合品牌附加费 15%', '长期协议倾向阶梯定价'] },
              { title: '风险与保护', icon: ShieldCheck, color: 'text-[var(--teal)]', bg: 'bg-[rgba(60,230,180,0.08)]', border: 'border-[rgba(60,230,180,0.2)]', items: ['技术保密期 3-10年不等', '核心专利保留策略', '反向授权条款逐步增加', '竞业禁止范围扩大'] },
              { title: '趋势变化', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', items: ['从单向授权转向联合开发', '智驾算法授权快速增长', '电池技术许可壁垒提高', '平台化授权成为主流'] },
            ].map((card) => (
              <div key={card.title} className={`rounded-lg border p-5 ${card.bg} ${card.border}`}>
                <h4 className={`font-semibold ${card.color} mb-3 flex items-center gap-2`}>
                  <card.icon className="w-4 h-4" />
                  {card.title}
                </h4>
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${card.color.replace('text-', 'bg-')}`} />
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
            当前展示为模拟数据，仅供界面框架验证。正式数据将接入企业公告、专利数据库、
            商务部技术进出口统计、WIPO 专利合作条约等数据源。
            授权条款细节需接入企业年报及 SEC  filing 后自动切换至真实数据。
          </p>
        </div>
      </div>
    </div>
  )
}
