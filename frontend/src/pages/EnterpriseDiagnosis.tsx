import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import {
  Activity, AlertTriangle, Users, Award, ShieldCheck, ChevronRight, Building2,
  Radar as RadarIcon, Route, Lightbulb,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   M6 · 企业出海诊断 — 五项内功 ·  readiness score · 双轨路径
   ═══════════════════════════════════════════════════════════════ */

type TabKey = 'profile' | 'radar' | 'path' | 'improve'

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: 'profile', label: '企业画像', icon: Building2 },
  { key: 'radar', label: '能力雷达', icon: RadarIcon },
  { key: 'path', label: '路径匹配', icon: Route },
  { key: 'improve', label: '改进建议', icon: Lightbulb },
]

/* ── 五项内功维度 ── */
const FIVE_DIMS = [
  { key: 'tech', name: '技术创新力', weight: 0.25 },
  { key: 'brand', name: '品牌认知度', weight: 0.20 },
  { key: 'supply', name: '供应链韧性', weight: 0.20 },
  { key: 'channel', name: '渠道覆盖', weight: 0.20 },
  { key: 'org', name: '组织能力', weight: 0.15 },
]

/* ── 雷达图数据 ── */
const RADAR_DATA = FIVE_DIMS.map((d) => ({
  subject: d.name,
  sample: [78, 65, 82, 58, 70][FIVE_DIMS.indexOf(d)],
  average: [62, 48, 55, 42, 58][FIVE_DIMS.indexOf(d)],
  top: [92, 88, 90, 85, 86][FIVE_DIMS.indexOf(d)],
  fullMark: 100,
}))

/* ── 准备度分布散点数据 ── */
const READINESS_SCATTER = [
  // 独立领航者 (>=80)
  { x: 88, y: 85, z: 86, name: '领航A', cat: '独立领航者' },
  { x: 92, y: 78, z: 88, name: '领航B', cat: '独立领航者' },
  { x: 85, y: 90, z: 91, name: '领航C', cat: '独立领航者' },
  { x: 90, y: 82, z: 89, name: '领航D', cat: '独立领航者' },
  { x: 80, y: 88, z: 84, name: '领航E', cat: '独立领航者' },
  { x: 95, y: 80, z: 92, name: '领航F', cat: '独立领航者' },
  { x: 87, y: 86, z: 90, name: '领航G', cat: '独立领航者' },
  { x: 82, y: 92, z: 87, name: '领航H', cat: '独立领航者' },
  { x: 91, y: 84, z: 90, name: '领航I', cat: '独立领航者' },
  { x: 83, y: 89, z: 85, name: '领航J', cat: '独立领航者' },
  { x: 89, y: 81, z: 86, name: '领航K', cat: '独立领航者' },
  { x: 94, y: 87, z: 93, name: '领航L', cat: '独立领航者' },
  { x: 86, y: 83, z: 86, name: '领航M', cat: '独立领航者' },
  { x: 81, y: 91, z: 84, name: '领航N', cat: '独立领航者' },
  { x: 93, y: 79, z: 89, name: '领航O', cat: '独立领航者' },
  { x: 84, y: 88, z: 86, name: '领航P', cat: '独立领航者' },
  { x: 90, y: 85, z: 90, name: '领航Q', cat: '独立领航者' },
  { x: 88, y: 80, z: 85, name: '领航R', cat: '独立领航者' },
  { x: 85, y: 87, z: 85, name: '领航S', cat: '独立领航者' },
  { x: 92, y: 86, z: 91, name: '领航T', cat: '独立领航者' },
  { x: 87, y: 84, z: 87, name: '领航U', cat: '独立领航者' },
  { x: 91, y: 89, z: 92, name: '领航V', cat: '独立领航者' },
  { x: 83, y: 85, z: 84, name: '领航W', cat: '独立领航者' },
  // 舰队跟随者 (60-80)
  { x: 72, y: 65, z: 72, name: '跟随A', cat: '舰队跟随者' },
  { x: 68, y: 70, z: 68, name: '跟随B', cat: '舰队跟随者' },
  { x: 75, y: 62, z: 74, name: '跟随C', cat: '舰队跟随者' },
  { x: 65, y: 75, z: 70, name: '跟随D', cat: '舰队跟随者' },
  { x: 78, y: 68, z: 76, name: '跟随E', cat: '舰队跟随者' },
  { x: 62, y: 72, z: 66, name: '跟随F', cat: '舰队跟随者' },
  { x: 74, y: 66, z: 72, name: '跟随G', cat: '舰队跟随者' },
  { x: 70, y: 78, z: 75, name: '跟随H', cat: '舰队跟随者' },
  { x: 66, y: 64, z: 65, name: '跟随I', cat: '舰队跟随者' },
  { x: 76, y: 71, z: 75, name: '跟随J', cat: '舰队跟随者' },
  { x: 63, y: 69, z: 64, name: '跟随K', cat: '舰队跟随者' },
  { x: 73, y: 74, z: 74, name: '跟随L', cat: '舰队跟随者' },
  { x: 69, y: 67, z: 68, name: '跟随M', cat: '舰队跟随者' },
  { x: 77, y: 63, z: 72, name: '跟随N', cat: '舰队跟随者' },
  { x: 64, y: 76, z: 69, name: '跟随O', cat: '舰队跟随者' },
  { x: 71, y: 73, z: 72, name: '跟随P', cat: '舰队跟随者' },
  { x: 67, y: 68, z: 67, name: '跟随Q', cat: '舰队跟随者' },
  { x: 75, y: 70, z: 74, name: '跟随R', cat: '舰队跟随者' },
  { x: 61, y: 65, z: 62, name: '跟随S', cat: '舰队跟随者' },
  { x: 79, y: 72, z: 77, name: '跟随T', cat: '舰队跟随者' },
  { x: 72, y: 69, z: 71, name: '跟随U', cat: '舰队跟随者' },
  { x: 68, y: 74, z: 70, name: '跟随V', cat: '舰队跟随者' },
  { x: 74, y: 66, z: 71, name: '跟随W', cat: '舰队跟随者' },
  { x: 66, y: 71, z: 68, name: '跟随X', cat: '舰队跟随者' },
  { x: 70, y: 64, z: 67, name: '跟随Y', cat: '舰队跟随者' },
  { x: 65, y: 77, z: 70, name: '跟随Z', cat: '舰队跟随者' },
  { x: 73, y: 68, z: 72, name: '跟随AA', cat: '舰队跟随者' },
  { x: 62, y: 73, z: 66, name: '跟随BB', cat: '舰队跟随者' },
  { x: 78, y: 75, z: 78, name: '跟随CC', cat: '舰队跟随者' },
  { x: 69, y: 62, z: 66, name: '跟随DD', cat: '舰队跟随者' },
  // 准备中 (<60)
  { x: 55, y: 48, z: 48, name: '准备A', cat: '准备中' },
  { x: 42, y: 52, z: 45, name: '准备B', cat: '准备中' },
  { x: 58, y: 40, z: 52, name: '准备C', cat: '准备中' },
  { x: 38, y: 55, z: 42, name: '准备D', cat: '准备中' },
  { x: 50, y: 45, z: 48, name: '准备E', cat: '准备中' },
  { x: 45, y: 50, z: 46, name: '准备F', cat: '准备中' },
  { x: 52, y: 42, z: 50, name: '准备G', cat: '准备中' },
  { x: 40, y: 48, z: 43, name: '准备H', cat: '准备中' },
  { x: 48, y: 38, z: 45, name: '准备I', cat: '准备中' },
  { x: 35, y: 44, z: 38, name: '准备J', cat: '准备中' },
  { x: 54, y: 46, z: 51, name: '准备K', cat: '准备中' },
  { x: 44, y: 53, z: 47, name: '准备L', cat: '准备中' },
  { x: 49, y: 41, z: 46, name: '准备M', cat: '准备中' },
  { x: 37, y: 50, z: 41, name: '准备N', cat: '准备中' },
  { x: 53, y: 43, z: 49, name: '准备O', cat: '准备中' },
  { x: 46, y: 47, z: 45, name: '准备P', cat: '准备中' },
  { x: 41, y: 39, z: 40, name: '准备Q', cat: '准备中' },
  { x: 51, y: 51, z: 52, name: '准备R', cat: '准备中' },
  { x: 39, y: 46, z: 41, name: '准备S', cat: '准备中' },
  { x: 47, y: 44, z: 46, name: '准备T', cat: '准备中' },
  { x: 43, y: 37, z: 42, name: '准备U', cat: '准备中' },
  { x: 56, y: 49, z: 53, name: '准备V', cat: '准备中' },
  { x: 36, y: 43, z: 38, name: '准备W', cat: '准备中' },
  { x: 50, y: 40, z: 47, name: '准备X', cat: '准备中' },
  { x: 44, y: 54, z: 48, name: '准备Y', cat: '准备中' },
  { x: 42, y: 48, z: 44, name: '准备Z', cat: '准备中' },
  { x: 55, y: 44, z: 50, name: '准备AA', cat: '准备中' },
  { x: 38, y: 51, z: 43, name: '准备BB', cat: '准备中' },
  { x: 52, y: 47, z: 50, name: '准备CC', cat: '准备中' },
  { x: 40, y: 42, z: 40, name: '准备DD', cat: '准备中' },
  { x: 48, y: 50, z: 48, name: '准备EE', cat: '准备中' },
  { x: 45, y: 45, z: 45, name: '准备FF', cat: '准备中' },
  { x: 53, y: 41, z: 49, name: '准备GG', cat: '准备中' },
  { x: 37, y: 40, z: 38, name: '准备HH', cat: '准备中' },
  { x: 49, y: 53, z: 50, name: '准备II', cat: '准备中' },
  { x: 41, y: 44, z: 41, name: '准备JJ', cat: '准备中' },
  { x: 54, y: 46, z: 51, name: '准备KK', cat: '准备中' },
  { x: 39, y: 49, z: 43, name: '准备LL', cat: '准备中' },
  { x: 46, y: 52, z: 48, name: '准备MM', cat: '准备中' },
  { x: 43, y: 38, z: 42, name: '准备NN', cat: '准备中' },
  { x: 51, y: 44, z: 49, name: '准备OO', cat: '准备中' },
  { x: 40, y: 47, z: 42, name: '准备PP', cat: '准备中' },
  { x: 47, y: 43, z: 46, name: '准备QQ', cat: '准备中' },
  { x: 42, y: 55, z: 47, name: '准备RR', cat: '准备中' },
  { x: 50, y: 39, z: 46, name: '准备SS', cat: '准备中' },
  { x: 36, y: 46, z: 40, name: '准备TT', cat: '准备中' },
  { x: 55, y: 50, z: 54, name: '准备UU', cat: '准备中' },
  { x: 44, y: 40, z: 43, name: '准备VV', cat: '准备中' },
  { x: 52, y: 48, z: 51, name: '准备WW', cat: '准备中' },
  { x: 38, y: 44, z: 40, name: '准备XX', cat: '准备中' },
]

/* ── 双轨路径对比 ── */
const PATH_COMPARE = [
  { dim: '资金门槛', leader: '极高', leaderBadge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]', follower: '中等', followerBadge: 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)]', desc: '独立建厂需30-50亿RMB' },
  { dim: '技术门槛', leader: '高', leaderBadge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]', follower: '中低', followerBadge: 'bg-[rgba(60,230,180,0.12)] text-[var(--teal)]', desc: '核心三电自研 vs 集成方案' },
  { dim: '渠道门槛', leader: '高', leaderBadge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]', follower: '低', followerBadge: 'bg-[rgba(60,230,180,0.12)] text-[var(--teal)]', desc: '自建销售网络 vs 经销商合作' },
  { dim: '品牌门槛', leader: '极高', leaderBadge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]', follower: '中', followerBadge: 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)]', desc: '全球品牌认知度 TOP3' },
  { dim: '周期门槛', leader: '长(5-8年)', leaderBadge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)]', follower: '短(2-4年)', followerBadge: 'bg-[rgba(60,230,180,0.12)] text-[var(--teal)]', desc: '品牌培育周期差异显著' },
]

/* ── 能力差距分析 ── */
const GAP_DATA = FIVE_DIMS.map((d) => ({
  name: d.name,
  current: [78, 65, 82, 58, 70][FIVE_DIMS.indexOf(d)],
  target: [90, 85, 88, 82, 85][FIVE_DIMS.indexOf(d)],
  gap: [12, 20, 6, 24, 15][FIVE_DIMS.indexOf(d)],
}))

/* ── 诊断报告卡片 ── */
const REPORT_CARDS = [
  {
    name: 'Enterprise A',
    type: '独立领航者',
    score: 86,
    badge: 'bg-[rgba(60,230,180,0.12)] text-[var(--teal)] border-[rgba(60,230,180,0.2)]',
    dot: 'ch-dot-teal',
    strengths: ['技术创新力行业TOP3', '供应链垂直整合度高', '海外产能布局完善'],
    weaknesses: ['品牌溢价能力待提升', '欧美渠道渗透率偏低'],
    suggestion: '建议重点投入品牌全球化建设，强化欧美直营网络。',
  },
  {
    name: 'Enterprise B',
    type: '舰队跟随者',
    score: 72,
    badge: 'bg-[rgba(0,194,255,0.12)] text-[var(--cyan)] border-[rgba(0,194,255,0.2)]',
    dot: 'ch-dot',
    strengths: ['成本控制能力强', '区域渠道合作经验丰富'],
    weaknesses: ['核心技术依赖外部供应', '海外品牌认知度不足', '组织国际化能力弱'],
    suggestion: '建议通过战略联盟补强技术短板，优先切入东南亚/中东市场。',
  },
  {
    name: 'Enterprise C',
    type: '准备中',
    score: 48,
    badge: 'bg-[rgba(255,77,109,0.12)] text-[var(--danger)] border-[rgba(255,77,109,0.2)]',
    dot: 'ch-dot-danger',
    strengths: ['国内市场基础扎实'],
    weaknesses: ['技术创新力差距大', '无海外运营经验', '供应链国际化程度低', '渠道与组织能力薄弱'],
    suggestion: '建议先完成内功修炼，3年内聚焦国内高端化，同时建立海外市场调研团队。',
  },
]

/* ── 颜色工具 ── */
const CAT_COLORS: Record<string, string> = {
  '独立领航者': '#3ce6b4',
  '舰队跟随者': '#00c2ff',
  '准备中': '#ff4d6d',
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-xl" style={{ background: '#0a1a2b', borderColor: 'rgba(96,178,216,0.15)', color: '#eaf8ff' }}>
      {label && <div className="font-medium mb-1 text-[var(--cyan)]">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-[var(--muted-text)]">{p.name}:</span>
          <span className="font-semibold">{p.value}{p.unit || ''}</span>
        </div>
      ))}
    </div>
  )
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-xl" style={{ background: '#0a1a2b', borderColor: 'rgba(96,178,216,0.15)', color: '#eaf8ff' }}>
      <div className="font-medium text-[var(--cyan)]">{d.name}</div>
      <div className="text-[var(--muted-text)] mt-0.5">技术创新力: <span className="text-white">{d.x}</span></div>
      <div className="text-[var(--muted-text)]">品牌认知度: <span className="text-white">{d.y}</span></div>
      <div className="text-[var(--muted-text)]">综合准备度: <span className="text-white">{d.z}分</span></div>
      <div className="mt-1">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: CAT_COLORS[d.cat] + '22', color: CAT_COLORS[d.cat], border: `1px solid ${CAT_COLORS[d.cat]}44` }}>
          {d.cat}
        </span>
      </div>
    </div>
  )
}

export default function EnterpriseDiagnosis() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  /* 按类别拆分散点数据 */
  const leaderData = READINESS_SCATTER.filter((d) => d.cat === '独立领航者')
  const followerData = READINESS_SCATTER.filter((d) => d.cat === '舰队跟随者')
  const preparingData = READINESS_SCATTER.filter((d) => d.cat === '准备中')

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* 页面标题                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] tracking-wider uppercase">Enterprise Readiness</span>
        </div>
        <h2 className="text-2xl font-bold text-white">企业出海诊断</h2>
        <p className="text-[var(--muted-text)] mt-1">五项内功 · 出海准备度 · 双轨路径 · 能力差距</p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* KPI 卡片                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '诊断企业数', value: '156', unit: '家', dot: 'ch-dot', sub: '覆盖NEV全产业链' },
          { label: '五项内功达标率', value: '34.6', unit: '%', dot: 'ch-dot-amber', sub: '平均得分≥60分' },
          { label: '出海准备度优秀', value: '23', unit: '家', dot: 'ch-dot-teal', sub: '独立领航者梯队' },
          { label: '待加强企业', value: '89', unit: '家', dot: 'ch-dot-danger', sub: '占比57.1%' },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-4">
              <div className="flex items-center gap-2">
                <span className={`${kpi.dot} rounded-full`} style={{ width: 6, height: 6 }} />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="ch-glow-num text-3xl text-white">{kpi.value}</span>
                <span className="text-xs text-[var(--muted-text)]">{kpi.unit}</span>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Tab 切换                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex gap-1 border-b border-[rgba(96,178,216,0.12)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[var(--cyan)] text-[var(--cyan)] shadow-[0_4px_20px_rgba(0,194,255,0.12)]'
                : 'border-transparent text-[var(--muted-text)] hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ① 企业画像 Tab                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* 样本诊断报告卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {REPORT_CARDS.map((card) => (
              <div key={card.name} className="ch-card-cut">
                <div className="ch-card-cut-inner p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`${card.dot} rounded-full`} style={{ width: 6, height: 6 }} />
                      <h3 className="font-semibold text-white">{card.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${card.badge}`}>
                      {card.type}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="ch-glow-num text-4xl text-white">{card.score}</span>
                    <span className="text-sm text-[var(--muted-text)]">/ 100</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-[var(--teal)] mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 核心优势
                      </p>
                      <ul className="space-y-1">
                        {card.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-[var(--muted-text)] flex items-start gap-1.5">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-[var(--teal)] flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--danger)] mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 短板
                      </p>
                      <ul className="space-y-1">
                        {card.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-[var(--muted-text)] flex items-start gap-1.5">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-[var(--danger)] flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-[rgba(96,178,216,0.08)]">
                      <p className="text-xs text-[var(--amber)] flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        {card.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 数据来源 */}
          <div className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3 text-xs text-[var(--muted-text)]">
              数据来源：企业年报、专利数据库、Brand Finance、S&P Global Mobility、MarkLines、海关出口数据、企业调研。更新频率：季度。
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 能力雷达 Tab                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 雷达图 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">五项内功雷达</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">样本企业 vs 行业平均 vs 顶尖水平</span>
                </div>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={RADAR_DATA}>
                      <PolarGrid stroke="rgba(96,178,216,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#809daf' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#809daf' }} />
                      <Radar name="样本企业" dataKey="sample" stroke="#00c2ff" fill="#00c2ff" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="行业平均" dataKey="average" stroke="#809daf" fill="#809daf" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
                      <Radar name="顶尖水平" dataKey="top" stroke="#3ce6b4" fill="#3ce6b4" fillOpacity={0.1} strokeWidth={1.5} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* 图例 */}
                <div className="flex items-center justify-center gap-4 mt-2">
                  {[
                    { color: '#00c2ff', label: '样本企业' },
                    { color: '#809daf', label: '行业平均' },
                    { color: '#3ce6b4', label: '顶尖水平' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--muted-text)]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 能力差距分析 */}
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">能力差距分析</h3>
                  <span className="text-xs text-[var(--muted-text)] ml-auto">当前能力 vs 目标水平</span>
                </div>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={GAP_DATA} layout="vertical" barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#809daf' }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#809daf' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="current" name="当前能力" fill="#00c2ff" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.7} />
                      <Bar dataKey="target" name="目标水平" fill="#3ce6b4" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* 准备度分布散点图 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">出海准备度分布</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">X: 技术创新力 · Y: 品牌认知度 · 气泡: 综合准备度</span>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis type="number" dataKey="x" name="技术创新力" domain={[30, 100]} tick={{ fontSize: 12, fill: '#809daf' }} label={{ value: '技术创新力', position: 'bottom', fill: '#809daf', fontSize: 12, offset: 0 }} />
                    <YAxis type="number" dataKey="y" name="品牌认知度" domain={[30, 100]} tick={{ fontSize: 12, fill: '#809daf' }} label={{ value: '品牌认知度', angle: -90, position: 'insideLeft', fill: '#809daf', fontSize: 12 }} />
                    <ZAxis type="number" dataKey="z" range={[30, 200]} />
                    <Tooltip content={<ScatterTooltip />} cursor={{ stroke: 'rgba(96,178,216,0.2)', strokeDasharray: '4 4' }} />
                    <Scatter name="独立领航者" data={leaderData} fill="#3ce6b4" fillOpacity={0.75} />
                    <Scatter name="舰队跟随者" data={followerData} fill="#00c2ff" fillOpacity={0.65} />
                    <Scatter name="准备中" data={preparingData} fill="#ff4d6d" fillOpacity={0.55} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* 图例与统计 */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-3">
                {[
                  { cat: '独立领航者', count: leaderData.length, color: '#3ce6b4', range: '≥80分' },
                  { cat: '舰队跟随者', count: followerData.length, color: '#00c2ff', range: '60-80分' },
                  { cat: '准备中', count: preparingData.length, color: '#ff4d6d', range: '<60分' },
                ].map((item) => (
                  <div key={item.cat} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                    <span className="text-xs text-[var(--muted-text)]">{item.cat}</span>
                    <span className="text-xs text-white font-medium">{item.count}家</span>
                    <span className="text-xs text-[var(--muted-text)]">({item.range})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 路径匹配 Tab                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'path' && (
        <div className="space-y-6">
          {/* 双轨路径对比表 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">双轨路径对比</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">独立领航者 vs 舰队跟随者</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[rgba(0,194,255,0.06)] to-transparent border-b border-[rgba(96,178,216,0.12)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">维度</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--teal)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <Award className="w-4 h-4" />
                          独立领航者
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--cyan)]">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="w-4 h-4" />
                          舰队跟随者
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PATH_COMPARE.map((row) => (
                      <tr key={row.dim} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                        <td className="py-3 px-4 font-medium text-white">{row.dim}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.leaderBadge}`}>
                            {row.leader}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.followerBadge}`}>
                            {row.follower}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--muted-text)] text-xs">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 路径特征速览 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[var(--teal)]" />
                  <h4 className="font-semibold text-white">独立领航者特征</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    '具备核心三电技术自研能力（电池/电机/电控）',
                    '年研发投入 ≥ 50亿元，专利储备行业TOP10',
                    '已建立≥3个海外生产基地或KD工厂',
                    '自有品牌在目标市场认知度 ≥ 60%',
                    '具备独立建设海外销售渠道的能力与资金',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] mt-1.5 flex-shrink-0 shadow-[0_0_4px_var(--teal)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[var(--cyan)]" />
                  <h4 className="font-semibold text-white">舰队跟随者特征</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    '核心技术依赖外部供应或授权合作',
                    '年研发投入 15-40亿元，聚焦应用层创新',
                    '通过合资/代工/出口模式进入海外市场',
                    '品牌认知度集中在特定区域（如东南亚/中东）',
                    '善于利用经销商网络与合作伙伴资源快速铺开',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] mt-1.5 flex-shrink-0 shadow-[0_0_4px_var(--cyan)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 改进建议 Tab                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'improve' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 分维度改进建议 */}
            {FIVE_DIMS.map((dim) => {
              const idx = FIVE_DIMS.indexOf(dim)
              const suggestions = [
                ['加大固态电池/智能驾驶研发投入', '建立海外研发中心吸引顶尖人才', '通过并购获取关键技术专利'],
                ['赞助国际顶级体育赛事提升曝光', '在目标市场投放本地化品牌广告', '邀请当地KOL进行产品体验营销'],
                ['海外建厂实现属地化供应链', '与全球TOP3物流商签署战略合作', '建立关键材料6个月安全库存'],
                ['优先进入经销商体系成熟的右舵市场', '在重点国家设立直营体验中心', '与当地头部出行平台达成B端合作'],
                ['引进具有国际视野的海外业务负责人', '建立跨文化管理体系与培训机制', '实施海外员工本地化招聘策略'],
              ][idx]
              return (
                <div key={dim.key} className="ch-card-cut-sm">
                  <div className="ch-card-cut-sm-inner p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="ch-title-bar" />
                      <h4 className="font-semibold text-white">{dim.name}</h4>
                      <span className="text-xs text-[var(--muted-text)] ml-auto">权重 {dim.weight * 100}%</span>
                    </div>
                    <ul className="space-y-2">
                      {suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-[var(--muted-text)] flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-[var(--cyan)] flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 分梯队行动路线图 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">分梯队出海行动路线图</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: '独立领航者',
                    color: 'var(--teal)',
                    steps: [
                      { t: 'Q1-Q2', a: '完成欧美市场品牌定位调研' },
                      { t: 'Q3-Q4', a: '启动欧洲/北美建厂可行性研究' },
                      { t: 'Year 2', a: '首个海外工厂动工，本地化团队搭建' },
                      { t: 'Year 3', a: '实现目标市场TOP3品牌份额' },
                    ],
                  },
                  {
                    title: '舰队跟随者',
                    color: 'var(--cyan)',
                    steps: [
                      { t: 'Q1-Q2', a: '锁定1-2个重点国家，寻找经销商伙伴' },
                      { t: 'Q3-Q4', a: '签署KD/合资协议，启动本地化适配' },
                      { t: 'Year 2', a: '首批车型交付，建立售后网络' },
                      { t: 'Year 3', a: '复制成功模式拓展至3-5国' },
                    ],
                  },
                  {
                    title: '准备中',
                    color: 'var(--danger)',
                    steps: [
                      { t: 'Q1-Q2', a: '完成出海准备度自评与差距分析' },
                      { t: 'Q3-Q4', a: '补齐核心能力短板（技术/品牌/渠道）' },
                      { t: 'Year 2', a: '试水东南亚/中东等低门槛市场' },
                      { t: 'Year 3', a: '评估规模化出海可行性' },
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="rounded-lg border border-[rgba(96,178,216,0.1)] p-4" style={{ background: 'rgba(9,32,64,0.4)' }}>
                    <h4 className="font-semibold text-sm mb-3" style={{ color: group.color }}>{group.title}</h4>
                    <div className="space-y-3 relative">
                      <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: `linear-gradient(180deg, ${group.color}44, transparent)` }} />
                      {group.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 relative pl-5">
                          <span className="absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${group.color}22`, color: group.color, border: `1px solid ${group.color}44` }}>
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${group.color}18`, color: group.color }}>{step.t}</span>
                            <p className="text-xs text-[var(--muted-text)] mt-1">{step.a}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
