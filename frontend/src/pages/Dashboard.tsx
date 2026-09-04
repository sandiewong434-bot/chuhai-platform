import { Link } from 'react-router-dom'
import {
  Factory, Ship, Globe, ShieldAlert, Building2, FileText,
  Network, Radio, TrendingUp, AlertTriangle,
  ArrowRight, BarChart3, Calculator, Wrench, Car,
  Activity, Bell, Newspaper, AlertCircle,
  ChevronRight, Target,
} from 'lucide-react'
import GlobeCanvas from '@/components/GlobeCanvas'
import RadarChart from '@/components/RadarChart'
import SvgLineChart from '@/components/SvgLineChart'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { articleApi, sourceApi, indicatorApi } from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// 模块定义
// ═══════════════════════════════════════════════════════════════
const modules = [
  { id: 'M1', title: '产业链全景', desc: '锂矿→材料→电池→整车→设施全链路', icon: Factory, path: '/industry', status: 'online', phase: 'P0' },
  { id: 'M2', title: '全球市场洞察', desc: '全球空间、竞争格局、关税壁垒', icon: Globe, path: '/scores', status: 'partial', phase: 'P1' },
  { id: 'M3', title: '出口分析', desc: '规模、结构、国别、品牌、模式七维分析', icon: Ship, path: '/export', status: 'online', phase: 'P0' },
  { id: 'M4', title: '对外投资分析', desc: '资金流向、区域布局、产业链环节', icon: TrendingUp, path: '#', status: 'coming', phase: 'P1' },
  { id: 'M5', title: '技术授权与合作', desc: '技术输出规模、模式、合作网络', icon: Wrench, path: '#', status: 'coming', phase: 'P2' },
  { id: 'M6', title: '企业内功诊断', desc: '五项内功雷达图 + 出海路径适配', icon: BarChart3, path: '/enterprises', status: 'partial', phase: 'P2' },
  { id: 'M7', title: '目标市场筛选', desc: '先锋/主力/潜力三级梯队推荐', icon: Target, path: '/scores', status: 'partial', phase: 'P0' },
  { id: 'M8', title: '进入模式测算', desc: '模式对比、成本测算、回本周期', icon: Calculator, path: '#', status: 'coming', phase: 'P1' },
  { id: 'M9', title: '风险监控预警', desc: '实时风险驾驶舱、热力地图、红绿灯', icon: ShieldAlert, path: '/barriers', status: 'partial', phase: 'P0' },
  { id: 'M10', title: '产品选品分析', desc: '车型TOP10、竞品对比、选品建议', icon: Car, path: '#', status: 'coming', phase: 'P1' },
]

const statusConfig: Record<string, { text: string; bg: string; textColor: string; border: string }> = {
  online: { text: '已上线', bg: 'bg-[rgba(60,230,180,0.12)]', textColor: 'text-[var(--teal)]', border: 'border-[var(--teal)]/20' },
  partial: { text: '基础版', bg: 'bg-[rgba(0,194,255,0.12)]', textColor: 'text-[var(--cyan)]', border: 'border-[var(--cyan)]/20' },
  coming: { text: '待上线', bg: 'bg-white/5', textColor: 'text-[var(--muted-text)]', border: 'border-white/10' },
}

const phaseLabel: Record<string, string> = {
  P0: '第一期（0-3月）',
  P1: '第二期（3-6月）',
  P2: '第三期（6-12月）',
}

const countryRisk = [
  { country: '欧盟', level: '高', cases: 3, color: '#ef4444' },
  { country: '美国', level: '高', cases: 2, color: '#ef4444' },
  { country: '土耳其', level: '中', cases: 1, color: '#f59e0b' },
  { country: '印度', level: '中', cases: 1, color: '#f59e0b' },
  { country: '俄罗斯', level: '低', cases: 0, color: '#22c55e' },
  { country: '泰国', level: '低', cases: 0, color: '#22c55e' },
]

const signalList = [
  { label: '动力电池', sub: '装机需求增强', value: '+8.6%', status: 'up' as const },
  { label: '整车出口', sub: '东南亚订单上行', value: '+13.2%', status: 'up' as const },
  { label: '锂盐现货', sub: '价格短期波动', value: '+1.8%', status: 'amber' as const },
]

// ═══════════════════════════════════════════════════════════════
// KPI 卡片组件
// ═══════════════════════════════════════════════════════════════
function KpiCard({ label, value, note, status = 'up', icon: Icon }: {
  label: string; value: string; note: string; status?: 'up' | 'danger' | 'amber'
  icon: React.ElementType
}) {
  const statusColors = {
    up: 'text-[var(--teal)]',
    danger: 'text-[var(--danger)]',
    amber: 'text-[var(--amber)]',
  }
  const dotClass = {
    up: 'ch-dot-teal',
    danger: 'ch-dot-danger',
    amber: 'ch-dot-amber',
  }
  return (
    <div className="ch-card-cut-sm">
      <div className="ch-card-cut-sm-inner p-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[rgba(0,194,255,0.1)]">
            <Icon className="w-4 h-4 text-[var(--cyan)]" />
          </div>
          <span className={`ch-dot rounded-full ${dotClass[status]}`} />
          <span className="text-xs text-[var(--muted-text)]">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-xl font-bold text-white ch-glow-num">{value}</p>
          <span className={`text-xs font-medium ${statusColors[status]}`}>
            {status === 'up' ? '↑ ' : status === 'danger' ? '↑ ' : '• '}{note}
          </span>
        </div>
      </div>
    </div>
  )
}
type NewsItem = { time: string; type: string; title: string; urgent: boolean }


// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [visualMode, setVisualMode] = useState<'sphere' | 'map'>('sphere')
  const [m6Values, setM6Values] = useState([78, 72, 69, 83, 65])
  const [m6Labels] = useState(['现金流', '供应链', '产能', '意愿', '数字化'])

  // ── 真实 API 数据 ──
  const { data: recentArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ['dashboard', 'recentArticles'],
    queryFn: () => articleApi.list({ page: 1, size: 6 }).then(r => r.data),
    placeholderData: { items: [], total: 0 },
  })

  const { data: stats7d } = useQuery({
    queryKey: ['dashboard', 'stats7d'],
    queryFn: () => articleApi.stats(7).then(r => r.data).catch(() => ({ total: 0 })),
    placeholderData: { total: 12 },
  })

  const { data: sourceOverview } = useQuery({
    queryKey: ['dashboard', 'sourceOverview'],
    queryFn: () => sourceApi.overview().then(r => r.data).catch(() => ({ total: 0, active: 0 })),
    placeholderData: { total: 18, active: 15 },
  })

  // ── C011 整车出口总量及全球排名 ──
  const { data: exportGlobalData } = useQuery({
    queryKey: ['dashboard', 'exportGlobalRank'],
    queryFn: () => indicatorApi.getPoints('vehicle_export_global_rank', { limit: 20 }).then(r => r.data).catch(() => ({ items: [] })),
    placeholderData: { items: [] },
  })

  // ── C012 海外投资目的国 TOP10 ──
  const { data: investmentData } = useQuery({
    queryKey: ['dashboard', 'investmentTop10'],
    queryFn: () => indicatorApi.getPoints('overseas_investment_top10', { limit: 20 }).then(r => r.data).catch(() => ({ items: [] })),
    placeholderData: { items: [] },
  })


  const avgM6 = Math.round(m6Values.reduce((a, b) => a + b, 0) / 5)
  const m6Recommendation = avgM6 >= 75
    ? '综合判断：内功成熟，适合"渠道先行 + 本地组装"的双轨路径并行。'
    : avgM6 >= 60
      ? '综合判断：建议先通过轻资产渠道验证，再分阶段推进本地组装。'
      : '综合判断：建议先补强现金流与供应链弹性，再进入海外市场。'

  const onlineModules = modules.filter(m => m.status === 'online')
  const partialModules = modules.filter(m => m.status === 'partial')
  const comingModules = modules.filter(m => m.status === 'coming')

  // 将 API 文章数据映射为最新动态
  const apiNews: NewsItem[] = (recentArticles?.items || []).slice(0, 5).map((a: any) => {
    const typeMap: Record<string, string> = {
      risk: 'risk', policy: 'policy', data: 'data', enterprise: 'enterprise',
      trade: 'risk', investment: 'enterprise', technology: 'enterprise',
    }
    const type = typeMap[a.category_layer || a.category_tag || ''] || 'data'
    const dateObj = a.publish_date ? new Date(a.publish_date) : null
    const timeStr = dateObj
      ? `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
      : '近期'
    return {
      time: timeStr,
      type,
      title: a.title || '无标题',
      urgent: type === 'risk' || type === 'policy',
    }
  })

  const latestNews = apiNews.length > 0 ? apiNews : [
    { time: '10分钟前', type: 'risk', title: '欧盟对华电动汽车反补贴税正式生效，税率17-35.3%', urgent: true },
    { time: '32分钟前', type: 'data', title: '6月NEV出口58.7万辆，渗透率41.8%创历史新高', urgent: false },
    { time: '1小时前', type: 'policy', title: '美国宣布对华301关税上调，电动汽车关税提至100%', urgent: true },
    { time: '2小时前', type: 'enterprise', title: '比亚迪泰国工厂正式投产，年产能15万辆', urgent: false },
    { time: '3小时前', type: 'data', title: '宁德时代发布2026H1财报：海外营收同比+67%', urgent: false },
  ]

  // KPI 真实值（有数据时替换）
  const articleTotal = recentArticles?.total ?? 173
  const articleNew = stats7d?.total ?? 12
  const sourceTotal = sourceOverview?.total ?? 18
  const sourceOnline = sourceOverview?.active ?? 15

  return (
    <div className="relative space-y-8 max-w-[1400px] mx-auto ch-bg-glow ch-grid-fine">
      {/* 扫描线装饰 */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,194,255,0.12)] to-transparent ch-scan-line" />
      </div>
      {/* ── 页面标题 ── */}
      <div className="ch-page-head">
        <span className="eyebrow">GLOBAL DECISION COMMAND</span>
        <h1>新能源汽车出海智能决策中心</h1>
        <p>以产业全景为底座，连接市场机会、企业行动与风险处置</p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 战略判断 Ribbon                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="ch-card p-4 flex flex-wrap items-center gap-4 lg:gap-6 bg-gradient-to-r from-[rgba(0,194,255,0.04)] to-transparent">
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--muted-text)]">本期战略判断</span>
          <p className="text-sm font-semibold text-white mt-1">出海机会从"规模优先"转向"本地化能力优先"</p>
        </div>
        <div className="hidden lg:block w-px h-10 bg-[rgba(96,178,216,0.15)]" />
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--muted-text)]">优先动作</span>
          <p className="text-sm font-semibold text-white mt-1">泰国右舵渠道 + 本地组装路径验证</p>
        </div>
        <div className="hidden lg:block w-px h-10 bg-[rgba(96,178,216,0.15)]" />
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--muted-text)]">董事会关注</span>
          <p className="text-sm font-semibold text-white mt-1">欧盟电池法规与关键材料供应韧性</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第一行：KPI + 核心可视化                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI 卡片 */}
        <div className="lg:col-span-1 space-y-3">
          <KpiCard label="收录文章" value={String(articleTotal)} note={`${articleNew > 0 ? '+' : ''}${articleNew} 本周`} status="up" icon={FileText} />
          <KpiCard label="信源数量" value={String(sourceTotal)} note={`${sourceOnline} 在线`} status="up" icon={Radio} />
          <KpiCard label="机会市场" value="26" note="3" status="up" icon={Globe} />
          <KpiCard label="待处置风险" value="07" note="2" status="danger" icon={AlertTriangle} />
        </div>

        {/* 核心可视化 - 态势球 */}
        <div className="lg:col-span-2 ch-card-cut p-px relative overflow-hidden">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">GLOBAL SIGNAL SPHERE</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="ch-title-bar" />
                  <h3 className="text-base font-semibold text-white">全球产业态势球</h3>
                </div>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">产业信号与出海航线的聚合视图</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setVisualMode('sphere')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    visualMode === 'sphere'
                      ? 'bg-[rgba(0,194,255,0.2)] text-[var(--cyan)] border border-[var(--cyan)]/30'
                      : 'text-[var(--muted-text)] hover:text-white'
                  }`}
                >
                  态势球
                </button>
                <button
                  onClick={() => setVisualMode('map')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    visualMode === 'map'
                      ? 'bg-[rgba(0,194,255,0.2)] text-[var(--cyan)] border border-[var(--cyan)]/30'
                      : 'text-[var(--muted-text)] hover:text-white'
                  }`}
                >
                  地图
                </button>
              </div>
            </div>
            
            <div className="relative h-[240px] flex items-center justify-center">
              {visualMode === 'sphere' ? (
                <>
                  <GlobeCanvas width={320} height={240} />
                  {/* 区域标记 */}
                  <div className="absolute top-4 left-4 text-center">
                    <b className="text-xs text-white">欧 洲</b>
                    <span className="block text-[10px] text-[var(--muted-text)]">法规 / 份额</span>
                    <i className="text-sm font-bold text-[var(--amber)]">76</i>
                  </div>
                  <div className="absolute top-8 right-8 text-center">
                    <b className="text-xs text-white">东南亚</b>
                    <span className="block text-[10px] text-[var(--muted-text)]">需求 / 渠道</span>
                    <i className="text-sm font-bold text-[var(--teal)]">92</i>
                  </div>
                  <div className="absolute bottom-6 left-1/3 text-center">
                    <b className="text-xs text-white">拉 丁</b>
                    <span className="block text-[10px] text-[var(--muted-text)]">价格 / 增量</span>
                    <i className="text-sm font-bold text-[var(--cyan)]">79</i>
                  </div>
                  {/* 统计 */}
                  <div className="absolute bottom-2 right-4 text-right">
                    <b className="text-lg font-bold text-white">26</b>
                    <span className="block text-[10px] text-[var(--muted-text)]">机会市场</span>
                    <small className="text-[10px] text-[var(--cyan)]">12 条活跃出海航线</small>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--muted-text)]">
                  <Globe className="w-16 h-16 opacity-20 mb-2" />
                  <span className="text-sm">地图视图开发中</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第二行：信号卡片 + 雷达图 + AI Copilot             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 全球产业信号 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">LIVE SIGNAL FEED</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="ch-title-bar" />
                  <h3 className="text-base font-semibold text-white">全球产业信号</h3>
                </div>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">跨产业、市场与政策的联动监测</p>
              </div>
              <span className="ch-chip active">实时</span>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(96,178,216,0.12)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--teal)" strokeWidth="8"
                    strokeDasharray={`${84.6 * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-lg font-bold text-white">84.6</b>
                  <small className="text-[9px] text-[var(--muted-text)]">全球活跃度</small>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--teal)]">高景气</h4>
                <p className="text-xs text-[var(--muted-text)]">供给端稳定<br />海外需求继续上行</p>
              </div>
            </div>
            
            <div className="space-y-1">
              {signalList.map((s) => (
                <div key={s.label} className="ch-signal-line">
                  <i className={s.status === 'amber' ? '!bg-[var(--amber)] !shadow-[var(--amber)]' : ''} />
                  <div>
                    <b className="text-sm text-white">{s.label}</b>
                    <small className="block text-xs text-[var(--muted-text)]">{s.sub}</small>
                  </div>
                  <em className={s.status === 'amber' ? 'amber' : ''}>{s.value}</em>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-[rgba(0,194,255,0.08)] to-[rgba(60,230,180,0.04)] border border-[rgba(0,194,255,0.12)]">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">FOCUS SIGNAL</span>
              <p className="text-sm font-semibold text-white mt-1">泰国本地化供给链进入窗口正在打开</p>
            </div>
          </div>
        </div>

        {/* 企业内功雷达图 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="mb-4">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">SELF-ASSESSMENT</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="ch-title-bar" />
                <h3 className="text-base font-semibold text-white">企业出海内功诊断</h3>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">拖动五个能力维度，实时生成企业画像</p>
            </div>
            
            <div className="flex justify-center">
              <RadarChart values={m6Values} labels={m6Labels} width={220} height={180} />
            </div>
            
            <div className="mt-3 space-y-2">
              {m6Labels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-text)] w-16">{label}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={m6Values[i]}
                    onChange={(e) => {
                      const newValues = [...m6Values]
                      newValues[i] = +e.target.value
                      setM6Values(newValues)
                    }}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--cyan) 0%, var(--cyan) ${m6Values[i]}%, rgba(96,178,216,0.2) ${m6Values[i]}%, rgba(96,178,216,0.2) 100%)`,
                    }}
                  />
                  <span className="text-xs text-white w-8 text-right">{m6Values[i]}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-2.5 rounded-lg bg-[rgba(60,230,180,0.08)] border border-[var(--teal)]/15">
              <p className="text-xs text-[var(--teal)]">{m6Recommendation}</p>
            </div>
          </div>
        </div>

        {/* AI 决策 Copilot */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="mb-4">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">AI DECISION COPILOT</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="ch-title-bar" />
                <h3 className="text-base font-semibold text-white">今日决策建议</h3>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">基于市场、监管、竞品和供应链推演</p>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-[rgba(0,194,255,0.1)] to-transparent border border-[rgba(0,194,255,0.15)]">
              <span className="text-[10px] font-semibold tracking-wider text-[var(--cyan)]">优先行动 / P0</span>
              <h4 className="text-lg font-bold text-white mt-2">加速布局泰国<br />右舵车型渠道</h4>
              <p className="text-xs text-[var(--muted-text)] mt-2">需求、政策与渠道指标同步越过阈值，建议提前锁定本地合作资源。</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-[var(--muted-text)]">建议置信度</span>
                <b className="text-sm text-[var(--teal)]">92%</b>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: '92%' }} />
                </div>
              </div>
              <button className="ch-btn-primary w-full mt-3 text-center">
                生成进入行动包 →
              </button>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,77,109,0.06)] border border-[var(--danger)]/10">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)]" />
                <div className="flex-1">
                  <b className="text-xs text-white">关注欧盟电池护照</b>
                  <small className="block text-[10px] text-[var(--muted-text)]">合规窗口剩余 43 天</small>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--danger)]/15 text-[var(--danger)] font-medium">高</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,176,32,0.06)] border border-[var(--amber)]/10">
                <Activity className="w-3.5 h-3.5 text-[var(--amber)]" />
                <div className="flex-1">
                  <b className="text-xs text-white">跟踪碳酸锂波动</b>
                  <small className="block text-[10px] text-[var(--muted-text)]">建议核查 3 家供应商</small>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--amber)]/15 text-[var(--amber)] font-medium">中</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第三行：趋势图 + 风险 + 动态                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 行业景气趋势 */}
        <div className="lg:col-span-1 ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">INDUSTRY MOMENTUM</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="ch-title-bar" />
                  <h3 className="text-base font-semibold text-white">行业景气趋势</h3>
                </div>
              </div>
              <span className="ch-chip">近 12 月</span>
            </div>
            <div className="h-[180px]">
              <SvgLineChart />
            </div>
          </div>
        </div>

        {/* 国别风险概览 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="ch-title-bar" />
              <ShieldAlert className="w-4 h-4 text-[var(--danger)]" />
              <h3 className="text-base font-semibold text-white">国别风险概览</h3>
            </div>
            <div className="space-y-2">
              {countryRisk.map((c) => (
                <div
                  key={c.country}
                  className={`flex items-center justify-between p-2 rounded ${
                    c.level === '高' ? 'ch-risk-bar' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${c.level === '高' ? 'ch-breathe' : ''}`}
                      style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }}
                    />
                    <span className="text-sm text-white">{c.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: c.color + '20', color: c.color, border: `1px solid ${c.color}30` }}
                    >
                      {c.level}风险
                    </span>
                    {c.cases > 0 && (
                      <span className="text-xs text-[var(--danger)] font-medium">{c.cases}起案件</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/barriers" className="flex items-center justify-center gap-1 mt-4 text-xs text-[var(--cyan)] hover:text-[var(--cyan)]/80">
              查看贸易壁垒详情 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 最新动态 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="ch-title-bar" />
                <Bell className="w-4 h-4 text-[var(--amber)]" />
                <h3 className="text-base font-semibold text-white">最新动态</h3>
              </div>
              <span className="text-xs text-[var(--muted-text)] flex items-center gap-1.5">
                <span className="ch-dot-danger rounded-full ch-breathe" />
                {latestNews.filter(n => n.urgent).length} 条紧急
                {articlesLoading && <span className="text-[10px] text-[var(--cyan)]">(加载中...)</span>}
              </span>
            </div>
            <div className="space-y-2">
              {latestNews.map((news, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg ${news.urgent ? 'bg-[rgba(255,77,109,0.08)] border border-[var(--danger)]/15' : 'bg-white/5'}`}>
                  <div className="flex items-start gap-2">
                    {news.type === 'risk' && <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)] mt-0.5 flex-shrink-0" />}
                    {news.type === 'data' && <BarChart3 className="w-3.5 h-3.5 text-[var(--cyan)] mt-0.5 flex-shrink-0" />}
                    {news.type === 'policy' && <Newspaper className="w-3.5 h-3.5 text-[var(--amber)] mt-0.5 flex-shrink-0" />}
                    {news.type === 'enterprise' && <Building2 className="w-3.5 h-3.5 text-[var(--teal)] mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${news.urgent ? 'font-medium text-[var(--danger)]' : 'text-white'}`}>
                        {news.title}
                      </p>
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">{news.time}</p>
                    </div>
                    {news.urgent && <span className="ch-dot-danger rounded-full ch-breathe flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/articles" className="flex items-center justify-center gap-1 mt-4 text-xs text-[var(--cyan)] hover:text-[var(--cyan)]/80">
              查看全部文章 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第四行：出口排名 + 投资流向                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* C011 整车出口总量及全球排名 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">C011 · EXPORT RANK</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="ch-title-bar" />
                  <h3 className="text-base font-semibold text-white">整车出口总量及全球排名</h3>
                </div>
              </div>
            </div>
            {(() => {
              const items = (exportGlobalData?.items || []).sort((a: any, b: any) => a.period_date.localeCompare(b.period_date))
              const latest = items[items.length - 1]
              return items.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-[var(--muted-text)]">最新年度出口量</span>
                    <span className="text-xl font-bold text-white">{latest?.value} <span className="text-xs text-[var(--muted-text)]">万辆</span></span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-[var(--muted-text)]">全球排名</span>
                    <span className="text-xl font-bold text-[var(--cyan)]">第 {latest?.dimension_json?.global_rank} 位</span>
                  </div>
                  <div className="space-y-2">
                    {items.slice(-5).map((item: any) => (
                      <div key={item.period_date} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-text)] w-12">{item.period_date?.slice(0, 4)}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--teal)] rounded-full" style={{ width: `${Math.min((item.value / 1000) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-white w-16 text-right">{item.value}万</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[var(--muted-text)]">暂无数据</div>
              )
            })()}
          </div>
        </div>

        {/* C012 海外投资目的国 TOP10 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--cyan)]">C012 · INVESTMENT FLOW</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="ch-title-bar" />
                  <h3 className="text-base font-semibold text-white">海外投资目的国 TOP10</h3>
                </div>
              </div>
            </div>
            {(() => {
              const items = (investmentData?.items || []).sort((a: any, b: any) => b.value - a.value).slice(0, 5)
              return items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.dimension_json?.rank} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.dimension_json?.rank <= 3 ? 'bg-[var(--cyan)] text-[#06111e]' : 'bg-white/10 text-[var(--muted-text)]'
                      }`}>
                        {item.dimension_json?.rank}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{item.dimension_json?.country}</span>
                          <span className="text-sm font-bold text-white">{item.value} <span className="text-xs text-[var(--muted-text)]">亿美元</span></span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--amber)] to-[var(--danger)] rounded-full" style={{ width: `${Math.min((item.value / (items[0]?.value || 1)) * 100, 100)}%` }} />
                        </div>
                        <p className="text-xs text-[var(--muted-text)] mt-0.5">{item.dimension_json?.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[var(--muted-text)]">暂无数据</div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第五行：十大功能模块                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="ch-page-head">
          <span className="eyebrow">FULL FUNCTION COVERAGE</span>
          <h1>十大功能模块</h1>
          <p>按映射表构建的业务模块，每个模块都可进入交互原型</p>
        </div>

        <div className="flex gap-4 text-xs mb-4">
          <span className="flex items-center gap-1.5">
            <span className="ch-dot-teal rounded-full" style={{ boxShadow: '0 0 4px var(--teal)' }} />
            <span className="text-[var(--muted-text)]">已上线</span>
            <b className="text-white">{onlineModules.length}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="ch-dot rounded-full" style={{ boxShadow: '0 0 4px var(--cyan)' }} />
            <span className="text-[var(--muted-text)]">基础版</span>
            <b className="text-white">{partialModules.length}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--muted-text)]" />
            <span className="text-[var(--muted-text)]">待上线</span>
            <b className="text-white">{comingModules.length}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {modules.map((mod) => {
            const isComing = mod.status === 'coming'
            const cfg = statusConfig[mod.status]
            return (
              <Link
                key={mod.id}
                to={isComing ? '#' : mod.path}
                onClick={isComing ? (e) => e.preventDefault() : undefined}
                className={`ch-card-cut block transition-all group ${
                  isComing ? 'opacity-50 cursor-not-allowed' : 'ch-module-card'
                }`}
              >
                <div className="ch-card-cut-inner p-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[rgba(0,194,255,0.08)]">
                      <mod.icon className={`w-5 h-5 ${isComing ? 'text-[var(--muted-text)]' : 'text-[var(--cyan)]'}`} />
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.textColor} ${cfg.border}`}>
                      {cfg.text}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mt-3">{mod.title}</h4>
                  <p className="text-xs text-[var(--muted-text)] mt-1 line-clamp-2">{mod.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-[var(--muted-text)] flex items-center gap-1.5">
                      <span className="ch-dot rounded-full" />
                      <span className="text-[var(--cyan)] tracking-wider">{mod.id}</span>
                      · {phaseLabel[mod.phase]}
                    </span>
                    {!isComing && <ChevronRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--cyan)] transition-colors" />}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 第五行：数据底座 + 建设进度                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 数据底座 */}
        <div className="lg:col-span-2">
          <div className="ch-page-head">
            <span className="eyebrow">DATA INFRASTRUCTURE</span>
            <h1>数据底座</h1>
          </div>
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
                className="ch-card-cut block group"
              >
                <div className="ch-card-cut-inner p-4 flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-[var(--muted-text)] group-hover:text-[var(--cyan)] transition-colors" />
                  <div>
                    <p className="font-medium text-white text-sm">{item.label}</p>
                    <p className="text-xs text-[var(--muted-text)]">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted-text)] ml-auto group-hover:text-[var(--cyan)] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 建设进度 */}
        <div className="ch-card-cut p-px">
          <div className="ch-card-cut-inner p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="ch-title-bar" />
              <h3 className="text-base font-semibold text-white">建设进度</h3>
            </div>
            <div className="space-y-4">
              {[
                { phase: 'P0 · 第一期', modules: 'M1产业链 / M3出口 / M7目标市场 / M9风险', progress: 60, color: 'bg-[var(--cyan)]' },
                { phase: 'P1 · 第二期', modules: 'M2全球市场 / M4对外投资 / M8模式测算 / M10产品', progress: 10, color: 'bg-[var(--amber)]' },
                { phase: 'P2 · 第三期', modules: 'M5技术授权 / M6内功诊断', progress: 0, color: 'bg-[var(--muted-text)]' },
              ].map((item) => (
                <div key={item.phase}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{item.phase}</span>
                    <span className="text-sm text-[var(--muted-text)]">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.progress}%` }} />
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-1">{item.modules}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据来源说明 */}
      <div className="ch-card-cut p-px border-[var(--amber)]/20">
        <div className="ch-card-cut-inner p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--amber)] mt-0.5 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <div className="ch-title-bar" />
              <p className="text-sm font-medium text-[var(--amber)]">数据说明</p>
            </div>
            <p className="text-sm text-[var(--muted-text)] mt-1">
              仪表盘已接入后端真实数据（文章数 {articleTotal} 篇 / 信源 {sourceOnline}/{sourceTotal} 个）。如 API 异常，将自动降级为演示数据。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
