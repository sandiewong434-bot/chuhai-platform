import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import ReactECharts from 'echarts-for-react'
import {
  Factory, Battery, Car, Zap, TrendingUp, AlertCircle,
  GitBranch, ScrollText, Calendar,
} from 'lucide-react'

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
// 模拟数据
// ═══════════════════════════════════════════════════════════════

// ① 上游
const upstreamData = [
  { name: '锂盐(万吨)', capacity: 45, output: 38 },
  { name: '钴(万吨)', capacity: 18, output: 15 },
  { name: '镍(万吨)', capacity: 280, output: 250 },
  { name: '石墨(万吨)', capacity: 120, output: 105 },
]
const priceTrendData = [
  { month: '1月', lithium: 45, cobalt: 32, nickel: 18 },
  { month: '2月', lithium: 42, cobalt: 30, nickel: 19 },
  { month: '3月', lithium: 38, cobalt: 28, nickel: 17 },
  { month: '4月', lithium: 40, cobalt: 31, nickel: 18 },
  { month: '5月', lithium: 43, cobalt: 33, nickel: 20 },
  { month: '6月', lithium: 41, cobalt: 29, nickel: 19 },
]

// ② 中游
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

// ③ 下游
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

// ④ 政策时间轴
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
          // 上游
          { name: '锂矿', itemStyle: { color: '#3b82f6' } },
          { name: '钴矿', itemStyle: { color: '#6366f1' } },
          { name: '镍矿', itemStyle: { color: '#8b5cf6' } },
          { name: '石墨', itemStyle: { color: '#64748b' } },
          { name: '稀土', itemStyle: { color: '#a855f7' } },
          // 中上游
          { name: '锂盐', itemStyle: { color: '#2563eb' } },
          { name: '钴材料', itemStyle: { color: '#4f46e5' } },
          { name: '镍材料', itemStyle: { color: '#7c3aed' } },
          { name: '负极材料', itemStyle: { color: '#475569' } },
          // 中游
          { name: '正极材料', itemStyle: { color: '#0ea5e9' } },
          { name: '隔膜', itemStyle: { color: '#06b6d4' } },
          { name: '电解液', itemStyle: { color: '#14b8a6' } },
          { name: '电芯', itemStyle: { color: '#10b981' } },
          { name: '模组', itemStyle: { color: '#22c55e' } },
          { name: 'PACK', itemStyle: { color: '#34d399' } },
          // 下游
          { name: 'BEV整车', itemStyle: { color: '#ef4444' } },
          { name: 'PHEV整车', itemStyle: { color: '#f97316' } },
          { name: 'EREV整车', itemStyle: { color: '#eab308' } },
          // 终端
          { name: '国内销售', itemStyle: { color: '#84cc16' } },
          { name: '海外出口', itemStyle: { color: '#22d3ee' } },
          { name: '电池回收', itemStyle: { color: '#a3a3a3' } },
        ],
        links: [
          // 上游 → 中上游
          { source: '锂矿', target: '锂盐', value: 45 },
          { source: '钴矿', target: '钴材料', value: 18 },
          { source: '镍矿', target: '镍材料', value: 280 },
          { source: '石墨', target: '负极材料', value: 120 },
          // 中上游 → 中游
          { source: '锂盐', target: '正极材料', value: 35 },
          { source: '锂盐', target: '电解液', value: 10 },
          { source: '钴材料', target: '正极材料', value: 15 },
          { source: '镍材料', target: '正极材料', value: 200 },
          { source: '负极材料', target: '电芯', value: 110 },
          { source: '稀土', target: '电芯', value: 25 },
          // 中游 → 中游
          { source: '正极材料', target: '电芯', value: 250 },
          { source: '隔膜', target: '电芯', value: 80 },
          { source: '电解液', target: '电芯', value: 90 },
          { source: '电芯', target: '模组', value: 500 },
          { source: '模组', target: 'PACK', value: 480 },
          // 中游 → 下游
          { source: 'PACK', target: 'BEV整车', value: 320 },
          { source: 'PACK', target: 'PHEV整车', value: 120 },
          { source: 'PACK', target: 'EREV整车', value: 40 },
          // 下游 → 终端
          { source: 'BEV整车', target: '国内销售', value: 220 },
          { source: 'BEV整车', target: '海外出口', value: 100 },
          { source: 'PHEV整车', target: '国内销售', value: 100 },
          { source: 'PHEV整车', target: '海外出口', value: 20 },
          { source: 'EREV整车', target: '国内销售', value: 38 },
          { source: 'EREV整车', target: '海外出口', value: 2 },
          // 回收
          { source: 'PACK', target: '电池回收', value: 20 },
        ],
        lineStyle: { color: 'source', curveness: 0.5, opacity: 0.4 },
        label: {
          color: '#374151',
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

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">产业链全景看板</h2>
        <p className="text-gray-500 mt-1">
          锂矿 → 材料 → 电池 → 整车 → 基础设施 全链路监控
        </p>
      </div>

      {/* ── 全链路 KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: '锂盐产能', value: '45万吨', icon: Factory, color: 'bg-blue-50 text-blue-700' },
          { label: '动力电池装机', value: '93.2GWh', icon: Battery, color: 'bg-green-50 text-green-700' },
          { label: 'NEV销量(6月)', value: '104.9万辆', icon: Car, color: 'bg-purple-50 text-purple-700' },
          { label: '充电桩保有量', value: '805万台', icon: Zap, color: 'bg-amber-50 text-amber-700' },
          { label: 'NEV渗透率', value: '40.1%', icon: TrendingUp, color: 'bg-cyan-50 text-cyan-700' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-md ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab 切换 ── */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">上游资源产能与产量</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={upstreamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="capacity" name="产能" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="output" name="产量" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">原材料价格走势（万元/吨）</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={priceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Line type="monotone" dataKey="lithium" name="碳酸锂" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cobalt" name="钴" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="nickel" name="镍" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <SourceNote>
            当前展示为模拟数据。正式数据将接入 USGS、Benchmark Minerals、SMM上海有色网、鑫椤资讯、安泰科 等数据源。
          </SourceNote>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ② 中游 · 核心零部件                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'midstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">四大材料产能占比</h3>
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

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">动力电池企业装机量 TOP 榜（GWh）</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={batteryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="capacity" name="装机量(GWh)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">NEV 销量与渗透率走势</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vehicleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="nev" name="NEV 销量(万辆)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">补能设施保有量（万台/座）</h3>
              <div className="space-y-4 mt-4">
                {chargingData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className="text-lg font-bold text-gray-900">{item.count}</span>
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

          {/* 整车企业梯队 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">整车企业销量梯队（2026 上半年）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">排名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">企业</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">销量（万辆）</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">同比</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">梯队</th>
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
                    <tr key={row.rank} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{row.rank}</td>
                      <td className="py-3 px-4 text-gray-900">{row.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 font-semibold">{row.sales}</td>
                      <td className={`py-3 px-4 text-right font-medium ${row.yoy.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {row.yoy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.tier === '第一梯队' ? 'bg-blue-100 text-blue-800' :
                          row.tier === '第二梯队' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">新能源汽车产业链全景流向图</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
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

          {/* 图例说明 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '上游矿产', color: 'bg-blue-500', desc: '锂/钴/镍/石墨' },
              { label: '中游材料', color: 'bg-cyan-500', desc: '正极/负极/隔膜/电解液' },
              { label: '电池制造', color: 'bg-green-500', desc: '电芯/模组/PACK' },
              { label: '下游整车', color: 'bg-red-500', desc: 'BEV/PHEV/EREV' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
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
            <span className="text-sm text-gray-500">政策级别：</span>
            {(['all', '国家级', '部委级', '地方级'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setPolicyFilter(level)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  policyFilter === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level === 'all' ? '全部' : level}
              </button>
            ))}
          </div>

          {/* 时间轴 */}
          <div className="relative">
            {/* 中轴线 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 lg:left-1/2 lg:-ml-px" />

            <div className="space-y-8">
              {filteredPolicies.map((policy, idx) => {
                const isLeft = idx % 2 === 0
                const impactColor =
                  policy.impact === '强' ? 'bg-red-50 border-red-200 text-red-700' :
                  policy.impact === '中' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-gray-50 border-gray-200 text-gray-600'
                const levelBadge =
                  policy.level === '国家级' ? 'bg-red-100 text-red-700' :
                  policy.level === '部委级' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'

                return (
                  <div key={idx} className="relative flex items-start lg:items-center">
                    {/* 时间节点圆点 */}
                    <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow -ml-[5px] z-10" />

                    {/* 内容卡片 */}
                    <div className={`ml-10 lg:ml-0 lg:w-[calc(50%-2rem)] ${isLeft ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">{policy.date}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBadge}`}>
                            {policy.level}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${impactColor}`}>
                            影响:{policy.impact}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">{policy.title}</h4>
                        <p className="text-sm text-gray-600">{policy.summary}</p>
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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800">数据来源说明</p>
        <p className="text-sm text-amber-700 mt-1">{children}</p>
      </div>
    </div>
  )
}
