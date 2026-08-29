import { useState, useEffect, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  Globe, TrendingUp, BarChart3, PieChart, MapPin,
  ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import * as echarts from 'echarts'

/* ═══════════════════════════════════════════════════════════════
   M2 · 全球市场空间 — 世界地图 + 渗透率 + 国别空间 + 车企格局
   ═══════════════════════════════════════════════════════════════ */

// ── 地图 geoJSON 加载 ──
function useWorldMap() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (echarts.getMap('world')) { setLoaded(true); return }
    fetch('https://cdn.jsdelivr.net/npm/echarts@5.4.3/map/json/world.json')
      .then(r => r.json())
      .then(geoJson => {
        echarts.registerMap('world', geoJson)
        setLoaded(true)
      })
      .catch(() => setLoaded(false))
  }, [])
  return loaded
}

// ── 全球渗透率模拟数据 ──
const penetrationData = [
  { name: '挪威', value: 89.2, region: '欧洲', yoy: '+4.1' },
  { name: '瑞典', value: 62.8, region: '欧洲', yoy: '+3.5' },
  { name: '荷兰', value: 58.3, region: '欧洲', yoy: '+2.8' },
  { name: '德国', value: 31.4, region: '欧洲', yoy: '+5.2' },
  { name: '中国', value: 52.4, region: '亚洲', yoy: '+8.6' },
  { name: '英国', value: 24.6, region: '欧洲', yoy: '+3.1' },
  { name: '法国', value: 22.1, region: '欧洲', yoy: '+2.9' },
  { name: '美国', value: 9.8,  region: '北美', yoy: '+1.8' },
  { name: '日本', value: 3.2,  region: '亚洲', yoy: '+0.4' },
  { name: '韩国', value: 9.5,  region: '亚洲', yoy: '+1.2' },
  { name: '泰国', value: 12.8, region: '亚洲', yoy: '+4.5' },
  { name: '澳大利亚', value: 8.6, region: '大洋洲', yoy: '+1.5' },
  { name: '巴西', value: 3.5,  region: '拉美', yoy: '+0.8' },
  { name: '墨西哥', value: 2.1, region: '拉美', yoy: '+0.5' },
  { name: '印度', value: 2.3,  region: '亚洲', yoy: '+0.9' },
  { name: '土耳其', value: 5.4, region: '中东', yoy: '+1.8' },
  { name: '以色列', value: 18.2, region: '中东', yoy: '+2.4' },
  { name: '加拿大', value: 8.1, region: '北美', yoy: '+1.3' },
  { name: '意大利', value: 15.3, region: '欧洲', yoy: '+3.2' },
  { name: '西班牙', value: 12.1, region: '欧洲', yoy: '+2.6' },
]

// ── 市场空间 TOP15 ──
const marketSpaceData = [
  { rank: 1, country: '中国',   sales2025: 1286, share: '64.8%', space2030: 2800, potential: '★★★★★', cShare: '自主', region: '亚洲' },
  { rank: 2, country: '美国',   sales2025: 186,  share: '9.4%',  space2030: 800,  potential: '★★★★★', cShare: '8.2%', region: '北美' },
  { rank: 3, country: '德国',   sales2025: 72,   share: '3.6%',  space2030: 280,  potential: '★★★★☆', cShare: '12.5%', region: '欧洲' },
  { rank: 4, country: '英国',   sales2025: 48,   share: '2.4%',  space2030: 160,  potential: '★★★★☆', cShare: '15.3%', region: '欧洲' },
  { rank: 5, country: '法国',   sales2025: 42,   share: '2.1%',  space2030: 140,  potential: '★★★★☆', cShare: '9.8%', region: '欧洲' },
  { rank: 6, country: '挪威',   sales2025: 12,   share: '0.6%',  space2030: 18,   potential: '★★☆☆☆', cShare: '3.2%', region: '欧洲' },
  { rank: 7, country: '日本',   sales2025: 38,   share: '1.9%',  space2030: 200,  potential: '★★★★☆', cShare: '2.1%', region: '亚洲' },
  { rank: 8, country: '韩国',   sales2025: 18,   share: '0.9%',  space2030: 60,   potential: '★★★☆☆', cShare: '5.4%', region: '亚洲' },
  { rank: 9, country: '泰国',   sales2025: 15,   share: '0.8%',  space2030: 80,   potential: '★★★★☆', cShare: '42.8%', region: '亚洲' },
  { rank: 10, country: '巴西',  sales2025: 8,    share: '0.4%',  space2030: 60,   potential: '★★★★☆', cShare: '6.5%', region: '拉美' },
  { rank: 11, country: '印度',  sales2025: 6,    share: '0.3%',  space2030: 200,  potential: '★★★★★', cShare: '3.8%', region: '亚洲' },
  { rank: 12, country: '澳大利亚', sales2025: 9, share: '0.5%',  space2030: 35,   potential: '★★★☆☆', cShare: '18.2%', region: '大洋洲' },
  { rank: 13, country: '加拿大', sales2025: 7,   share: '0.4%',  space2030: 40,   potential: '★★★☆☆', cShare: '4.1%', region: '北美' },
  { rank: 14, country: '意大利', sales2025: 11,  share: '0.6%',  space2030: 50,   potential: '★★★☆☆', cShare: '7.3%', region: '欧洲' },
  { rank: 15, country: '瑞典',  sales2025: 16,   share: '0.8%',  space2030: 22,   potential: '★★☆☆☆', cShare: '5.1%', region: '欧洲' },
]

// ── 车企竞争格局 ──
const oemCompeteData = [
  { oem: '比亚迪', global2025: 428.6, share: '21.6%', yoy: '+24.1%', leader: ['中国', '泰国', '巴西'] },
  { oem: '特斯拉', global2025: 186.2, share: '9.4%',  yoy: '+2.3%',  leader: ['美国', '澳大利亚'] },
  { oem: '吉利集团', global2025: 142.8, share: '7.2%', yoy: '+18.5%', leader: ['中国', '欧洲'] },
  { oem: '大众集团', global2025: 98.4,  share: '5.0%', yoy: '-3.2%',  leader: ['德国', '欧洲'] },
  { oem: '上汽集团', global2025: 88.6,  share: '4.5%', yoy: '+12.8%', leader: ['中国', '欧洲'] },
  { oem: 'Stellantis', global2025: 76.2, share: '3.8%', yoy: '+5.4%',  leader: ['欧洲', '北美'] },
  { oem: '现代-起亚', global2025: 68.4,  share: '3.4%', yoy: '+8.2%',  leader: ['韩国', '美国'] },
  { oem: '奇瑞集团', global2025: 62.4,  share: '3.1%', yoy: '+46.2%', leader: ['中国', '俄罗斯'] },
  { oem: '丰田集团', global2025: 58.2,  share: '2.9%', yoy: '+15.3%', leader: ['日本', '美国'] },
  { oem: '长安集团', global2025: 48.2,  share: '2.4%', yoy: '+32.4%', leader: ['中国'] },
]

// ── 区域分布环形图 ──
const regionPie = [
  { name: '中国', value: 1286 },
  { name: '欧洲', value: 312 },
  { name: '北美', value: 198 },
  { name: '亚洲(其他)', value: 86 },
  { name: '拉美', value: 24 },
  { name: '其他', value: 68 },
]

// ── 2030E 增长空间 ──
const growth2030Data = [
  { region: '中国',    current: 1286, target: 2800, cagr: '16.9%' },
  { region: '美国',    current: 186,  target: 800,  cagr: '33.8%' },
  { region: '欧洲',    current: 312,  target: 720,  cagr: '18.2%' },
  { region: '东南亚',  current: 45,   target: 280,  cagr: '44.2%' },
  { region: '拉美',    current: 24,   target: 120,  cagr: '38.1%' },
  { region: '中东',    current: 18,   target: 80,   cagr: '34.9%' },
  { region: '印度',    current: 6,    target: 200,  cagr: '100.0%' },
]

// ── Tab 配置 ──
type TabKey = 'map' | 'penetration' | 'space' | 'oem' | 'growth'
const TABS: { key: TabKey; label: string; icon: typeof Globe }[] = [
  { key: 'map', label: '全球地图', icon: MapPin },
  { key: 'penetration', label: '渗透率对比', icon: BarChart3 },
  { key: 'space', label: '国别空间', icon: Globe },
  { key: 'oem', label: '车企格局', icon: PieChart },
  { key: 'growth', label: '2030E增长', icon: TrendingUp },
]

// ── 颜色映射 ──
function getPenetrationColor(v: number) {
  if (v >= 50) return '#00c2ff'
  if (v >= 20) return '#3ce6b4'
  if (v >= 10) return '#ffb020'
  if (v >= 5)  return '#a58bff'
  return '#ff4d6d'
}

function getPotentialStars(s: string) {
  const n = (s.match(/★/g) || []).length
  return { n, color: n >= 4 ? '#00c2ff' : n >= 3 ? '#3ce6b4' : '#ffb020' }
}

export default function GlobalMarket() {
  const [activeTab, setActiveTab] = useState<TabKey>('map')
  const mapLoaded = useWorldMap()

  // ── 地图配置 ──
  const mapOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,26,43,0.95)',
      borderColor: 'rgba(0,194,255,0.3)',
      textStyle: { color: '#eaf8ff', fontSize: 13 },
      formatter: (p: any) => {
        const d = penetrationData.find(x => x.name === p.name)
        if (!d) return p.name
        return `<div style="font-weight:700;margin-bottom:4px">${p.name}</div>
                <div>NEV渗透率: <span style="color:${getPenetrationColor(d.value)};font-weight:700">${d.value}%</span></div>
                <div>区域: ${d.region}</div>
                <div>同比: ${d.yoy}%</div>`
      },
    },
    visualMap: {
      min: 0, max: 100,
      left: 20, bottom: 20,
      text: ['高', '低'],
      textStyle: { color: '#809daf' },
      calculable: true,
      inRange: {
        color: ['#0d2438', '#1a4a6e', '#00c2ff', '#3ce6b4'],
      },
    },
    geo: {
      map: 'world',
      roam: true,
      zoom: 1.2,
      center: [10, 20],
      itemStyle: {
        areaColor: '#0f2235',
        borderColor: 'rgba(0,194,255,0.15)',
      },
      emphasis: {
        itemStyle: { areaColor: '#1a3045' },
        label: { show: false },
      },
    },
    series: [{
      type: 'map',
      geoIndex: 0,
      data: penetrationData.map(d => ({ name: d.name, value: d.value })),
    }, {
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: penetrationData.filter(d => d.value >= 20).map(d => {
        const coordMap: Record<string, [number, number]> = {
          '中国': [104, 35], '美国': [-95, 37], '德国': [10, 51], '挪威': [10, 62],
          '英国': [-2, 54], '法国': [2, 46], '瑞典': [18, 60], '荷兰': [5, 52],
          '日本': [138, 36], '韩国': [128, 36], '泰国': [100, 15], '澳大利亚': [133, -27],
          '巴西': [-55, -10], '印度': [78, 20], '土耳其': [35, 39], '以色列': [35, 31],
          '加拿大': [-106, 56], '意大利': [12, 42], '西班牙': [-4, 40],
        }
        return {
          name: d.name,
          value: [...(coordMap[d.name] || [0, 0]), d.value],
          itemStyle: { color: getPenetrationColor(d.value) },
        }
      }),
      symbolSize: (val: number[]) => Math.sqrt(val[2]) * 1.8,
      rippleEffect: { brushType: 'stroke', scale: 3 },
      label: {
        show: true, formatter: '{b}', position: 'right',
        color: '#eaf8ff', fontSize: 10,
      },
    }],
  }), [])

  // ── 渗透率柱状图 ──
  const barOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,26,43,0.95)',
      borderColor: 'rgba(0,194,255,0.3)',
      textStyle: { color: '#eaf8ff' },
    },
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', max: 100,
      axisLine: { lineStyle: { color: 'rgba(96,178,216,0.2)' } },
      axisLabel: { color: '#809daf', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(96,178,216,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: [...penetrationData].sort((a, b) => a.value - b.value).map(d => d.name),
      axisLine: { lineStyle: { color: 'rgba(96,178,216,0.2)' } },
      axisLabel: { color: '#809daf' },
    },
    series: [{
      type: 'bar',
      data: [...penetrationData].sort((a, b) => a.value - b.value).map(d => ({
        value: d.value,
        itemStyle: { color: getPenetrationColor(d.value), borderRadius: [0, 4, 4, 0] },
      })),
      barWidth: 14,
      label: {
        show: true, position: 'right',
        color: '#eaf8ff', fontSize: 11,
        formatter: '{c}%',
      },
    }],
  }), [])

  // ── 2030 增长柱状图 ──
  const growthOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,26,43,0.95)',
      borderColor: 'rgba(0,194,255,0.3)',
      textStyle: { color: '#eaf8ff' },
    },
    legend: {
      data: ['2025年销量', '2030E目标'],
      textStyle: { color: '#809daf' },
      top: 0,
    },
    grid: { left: 60, right: 30, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: growth2030Data.map(d => d.region),
      axisLine: { lineStyle: { color: 'rgba(96,178,216,0.2)' } },
      axisLabel: { color: '#809daf', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(96,178,216,0.2)' } },
      axisLabel: { color: '#809daf' },
      splitLine: { lineStyle: { color: 'rgba(96,178,216,0.08)' } },
    },
    series: [
      {
        name: '2025年销量', type: 'bar',
        data: growth2030Data.map(d => d.current),
        itemStyle: { color: 'rgba(0,194,255,0.6)', borderRadius: [4, 4, 0, 0] },
        barWidth: 16,
      },
      {
        name: '2030E目标', type: 'bar',
        data: growth2030Data.map(d => d.target),
        itemStyle: { color: 'rgba(60,230,180,0.6)', borderRadius: [4, 4, 0, 0] },
        barWidth: 16,
      },
    ],
  }), [])

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div className="flex items-center gap-2">
        <div className="ch-title-bar" />
        <div>
          <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[var(--cyan)]">Market Intelligence</div>
          <h2 className="text-xl font-bold text-white mt-0.5">全球市场空间</h2>
        </div>
      </div>

      {/* ── 核心 KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '2025全球NEV销量', value: '1,974', unit: '万辆', dot: 'cyan', delta: '+21.3%', up: true },
          { label: '全球平均渗透率', value: '18.2', unit: '%', dot: 'teal', delta: '+3.2pct', up: true },
          { label: '2030E市场规模', value: '5,200', unit: '万辆', dot: 'amber', delta: 'CAGR 21.4%', up: true },
          { label: '中国品牌海外份额', value: '12.8', unit: '%', dot: 'danger', delta: '+4.5pct', up: true },
        ].map((kpi) => (
          <div key={kpi.label} className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className={`ch-dot ch-dot-${kpi.dot} rounded-full`} style={{ width: 6, height: 6 }} />
                <span className="text-xs text-[var(--muted-text)]">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="ch-glow-num text-3xl text-white">{kpi.value}</span>
                <span className="text-xs text-[var(--muted-text)]">{kpi.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {kpi.up ? <ArrowUpRight className="w-3 h-3 text-[var(--teal)]" /> : <ArrowDownRight className="w-3 h-3 text-[var(--danger)]" />}
                <span className={kpi.up ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}>{kpi.delta}</span>
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
      {/* ① 全球地图                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">全球 NEV 渗透率分布</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">2025年数据 · 深色=低 / 亮青=高</span>
              </div>
              {mapLoaded ? (
                <ReactECharts option={mapOption} style={{ height: 520 }} />
              ) : (
                <div className="h-[520px] flex items-center justify-center text-[var(--muted-text)]">
                  地图加载中...
                </div>
              )}
            </div>
          </div>

          {/* 图例说明 */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { color: '#00c2ff', label: '≥50%', desc: '领先市场' },
              { color: '#3ce6b4', label: '20%-50%', desc: '成长市场' },
              { color: '#ffb020', label: '10%-20%', desc: '初期市场' },
              { color: '#a58bff', label: '5%-10%', desc: '萌芽市场' },
              { color: '#ff4d6d', label: '<5%', desc: '潜力市场' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                <div>
                  <span className="text-white font-medium">{item.label}</span>
                  <span className="text-[var(--muted-text)] ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 渗透率对比                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'penetration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">各国 NEV 渗透率排名</h3>
              </div>
              <ReactECharts option={barOption} style={{ height: 480 }} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">区域分布</h3>
                </div>
                <ReactECharts option={{
                  backgroundColor: 'transparent',
                  series: [{
                    type: 'pie', radius: ['45%', '70%'],
                    data: regionPie.map((d, i) => ({
                      ...d,
                      itemStyle: { color: ['#00c2ff', '#3ce6b4', '#ffb020', '#a58bff', '#ff4d6d', '#6b7280'][i] },
                    })),
                    label: { color: '#809daf', fontSize: 11 },
                  }],
                }} style={{ height: 220 }} />
              </div>
            </div>

            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">渗透率分层</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { tier: '先锋市场 (≥50%)', countries: '挪威、瑞典、荷兰、中国', color: '#00c2ff' },
                    { tier: '成长市场 (20-50%)', countries: '德国、英国、法国、以色列', color: '#3ce6b4' },
                    { tier: '初期市场 (10-20%)', countries: '泰国、意大利、西班牙、韩国', color: '#ffb020' },
                    { tier: '潜力市场 (<10%)', countries: '美国、日本、巴西、印度等', color: '#a58bff' },
                  ].map((t) => (
                    <div key={t.tier} className="flex items-start gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                      <div>
                        <div className="text-white font-medium">{t.tier}</div>
                        <div className="text-[var(--muted-text)]">{t.countries}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ③ 国别市场空间                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'space' && (
        <div className="space-y-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">2025年全球 NEV 销量 TOP15 及中国品牌份额</h3>
                <span className="text-xs text-[var(--muted-text)] ml-auto">单位: 万辆</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(96,178,216,0.15)]">
                      {['排名', '国家/地区', '2025销量', '全球占比', '2030E空间', '市场潜力', '中国品牌份额', '区域'].map((h) => (
                        <th key={h} className="text-left py-3 px-3 font-medium text-[var(--muted-text)] text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketSpaceData.map((row) => {
                      const pot = getPotentialStars(row.potential)
                      return (
                        <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                              row.rank <= 3 ? 'bg-[rgba(0,194,255,0.15)] text-[var(--cyan)]' : 'text-[var(--muted-text)]'
                            }`}>
                              {String(row.rank).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium">{row.country}</td>
                          <td className="py-2.5 px-3">
                            <span className="ch-glow-num text-white">{row.sales2025}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[var(--muted-text)]">{row.share}</td>
                          <td className="py-2.5 px-3 text-[var(--teal)]">{row.space2030}</td>
                          <td className="py-2.5 px-3">
                            <span style={{ color: pot.color }}>{row.potential}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={row.cShare === '自主' ? 'text-[var(--cyan)]' : 'text-[var(--amber)]'}>
                              {row.cShare}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-[var(--muted-text)]">{row.region}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ④ 车企竞争格局                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'oem' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">2025 全球 NEV 销量 TOP10 车企</h3>
              </div>
              <div className="space-y-2">
                {oemCompeteData.map((o, i) => (
                  <div key={o.oem} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/[0.08] transition-colors">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-[rgba(0,194,255,0.15)] text-[var(--cyan)]' : 'text-[var(--muted-text)]'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{o.oem}</div>
                      <div className="text-xs text-[var(--muted-text)]">优势市场: {o.leader.join('、')}</div>
                    </div>
                    <div className="text-right">
                      <div className="ch-glow-num text-sm text-white">{o.global2025}万</div>
                      <div className={`text-xs flex items-center justify-end gap-0.5 ${o.yoy.startsWith('+') ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                        {o.yoy.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {o.yoy}
                      </div>
                    </div>
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--cyan)]" style={{ width: `${parseFloat(o.share)}%` }} />
                    </div>
                    <span className="text-xs text-[var(--muted-text)] w-10 text-right">{o.share}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">市场份额分布</h3>
                </div>
                <ReactECharts option={{
                  backgroundColor: 'transparent',
                  series: [{
                    type: 'pie', radius: ['35%', '60%'],
                    data: oemCompeteData.slice(0, 8).map((d, i) => ({
                      name: d.oem,
                      value: d.global2025,
                      itemStyle: { color: ['#00c2ff', '#3ce6b4', '#ffb020', '#a58bff', '#ff4d6d', '#4d7cff', '#00d4aa', '#ff6b6b'][i] },
                    })),
                    label: { color: '#809daf', fontSize: 11, formatter: '{b}\n{d}%' },
                  }],
                }} style={{ height: 320 }} />
              </div>
            </div>

            <div className="ch-card-cut-sm">
              <div className="ch-card-cut-sm-inner p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="ch-title-bar" />
                  <h3 className="text-sm font-bold text-white">关键洞察</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { icon: ChevronRight, text: '中国品牌全球份额达 38.5%，比亚迪一家占 21.6%', color: 'var(--cyan)' },
                    { icon: ChevronRight, text: '特斯拉仍是海外最大单一品牌，但增速放缓至 +2.3%', color: 'var(--amber)' },
                    { icon: ChevronRight, text: '奇瑞海外增速最快 (+46.2%)，俄罗斯/中东为核心市场', color: 'var(--teal)' },
                    { icon: ChevronRight, text: '欧洲市场大众/Stellantis 份额受中国车企挤压', color: 'var(--danger)' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <item.icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                      <span className="text-[var(--muted-text)]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑤ 2030E 增长空间                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'growth' && (
        <div className="space-y-4">
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="ch-title-bar" />
                <h3 className="text-sm font-bold text-white">2025 → 2030E 区域增长空间对比</h3>
              </div>
              <ReactECharts option={growthOption} style={{ height: 380 }} />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {growth2030Data.map((d) => (
              <div key={d.region} className="ch-card-cut-sm">
                <div className="ch-card-cut-sm-inner p-3">
                  <div className="text-xs text-[var(--muted-text)]">{d.region}</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="ch-glow-num text-xl text-white">{d.current}</span>
                    <span className="text-xs text-[var(--muted-text)]">→</span>
                    <span className="ch-glow-num text-xl text-[var(--teal)]">{d.target}</span>
                    <span className="text-xs text-[var(--muted-text)]">万辆</span>
                  </div>
                  <div className="text-xs text-[var(--amber)] mt-1">CAGR {d.cagr}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 数据来源 ── */}
      <div className="ch-card-cut-sm">
        <div className="ch-card-cut-sm-inner p-3 text-xs text-[var(--muted-text)]">
          数据来源：IEA Global EV Outlook 2025、中汽协、MarkLines、各国家汽车协会统计；中国品牌份额基于海关出口数据及当地注册量估算。
        </div>
      </div>
    </div>
  )
}
