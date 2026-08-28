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

const levelConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  high: { label: '高风险', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  medium: { label: '需关注', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: ShieldAlert },
  low: { label: '正常', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: Minus },
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

  const highRisks = riskEvents.filter((e) => e.level === 'high')
  const mediumRisks = riskEvents.filter((e) => e.level === 'medium')
  const lowRisks = riskEvents.filter((e) => e.level === 'low')
  const nevRisks = riskEvents.filter((e) => e.nev)

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
        <h2 className="text-2xl font-bold text-gray-900">风险监控与动态预警</h2>
        <p className="text-gray-500 mt-1">实时风险驾驶舱 · 关税壁垒 · 地缘政策 · 供应链监控</p>
      </div>

      {/* 风险分级统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '高风险事件', value: highRisks.length, sub: '需立即关注', color: 'bg-red-50 text-red-700', icon: AlertTriangle },
          { label: '需关注事件', value: mediumRisks.length, sub: '持续跟踪', color: 'bg-yellow-50 text-yellow-700', icon: ShieldAlert },
          { label: '正常/利好', value: lowRisks.length, sub: '常规监控', color: 'bg-green-50 text-green-700', icon: Minus },
          { label: 'NEV相关', value: nevRisks.length, sub: '直接影响', color: 'bg-blue-50 text-blue-700', icon: Globe },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <span className="text-xs text-gray-500">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">国别风险热力</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {countryRiskHeat.map((c) => {
                const cfg = c.level === 'high' ? levelConfig.high : c.level === 'medium' ? levelConfig.medium : levelConfig.low
                return (
                  <div key={c.country} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border} transition-all hover:shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{c.country}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{c.score}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-500">{c.events}起事件</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
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

          {/* 最新风险事件 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最新风险事件</h3>
            <div className="space-y-3">
              {riskEvents.slice(0, 6).map((event) => {
                const cfg = levelConfig[event.level]
                return (
                  <div key={event.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                    <cfg.icon className={`w-5 h-5 mt-0.5 ${cfg.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{event.title}</span>
                        {event.nev && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            NEV
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
      )}

      {/* ② 关税与贸易政策 */}
      {activeTab === 'barriers' && (
        <div className="space-y-4">
          {/* 筛选 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索案件或国家..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <button
                onClick={() => { setQ(''); setTypeFilter(''); setOnlyNEV(false) }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                重置
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">全部类型</option>
                <option value="反倾销调查">反倾销调查</option>
                <option value="反补贴调查">反补贴调查</option>
                <option value="关税措施">关税措施</option>
                <option value="贸易壁垒">贸易壁垒</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50">
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

          {/* 案件列表 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无数据</div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-lg border p-5 ${
                    c.nev_related ? 'border-red-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{c.title}</h3>
                        {c.nev_related && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            NEV
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{c.country}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c.type}</span>
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded">{c.status}</span>
                        <span className="text-gray-400">{c.date || '日期未知'}</span>
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
              { label: 'CFIUS审查', count: 3, country: '美国', icon: Landmark, color: 'bg-red-50 text-red-700' },
              { label: '外国补贴条例', count: 2, country: '欧盟', icon: Scale, color: 'bg-yellow-50 text-yellow-700' },
              { label: 'FDI限制', count: 4, country: '印度/印尼等', icon: FileWarning, color: 'bg-blue-50 text-blue-700' },
              { label: '数据安全审查', count: 1, country: '欧盟/美国', icon: ShieldAlert, color: 'bg-purple-50 text-purple-700' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <span className="text-xs text-gray-500">{item.country}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 审查案例列表 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">重点审查案例</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">审查类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">国家/地区</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">主要内容</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">影响程度</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">NEV影响</th>
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
                    const impactCfg = row.impact === 'high' ? { text: '高', color: 'bg-red-100 text-red-700' } :
                                     row.impact === 'medium' ? { text: '中', color: 'bg-yellow-100 text-yellow-700' } :
                                     { text: '低', color: 'bg-green-100 text-green-700' }
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.type}</td>
                        <td className="py-3 px-4 text-gray-700">{row.country}</td>
                        <td className="py-3 px-4 text-gray-600">{row.desc}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactCfg.color}`}>{impactCfg.text}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.nev ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">直接影响</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">间接</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 应对建议 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: '前置合规审查', icon: Scale, items: ['投资前完成CFIUS预申报评估', '梳理政府补贴明细，准备申报', '聘请当地律所做反垄断评估'] },
              { title: '本地化策略', icon: Globe, items: ['绿地投资替代并购，规避审查', '与当地企业合资，分散股权', '关键零部件属地化生产'] },
              { title: '数据合规', icon: ShieldAlert, items: ['欧盟数据本地化存储', '建立数据跨境传输合规框架', '隐私政策本地化适配'] },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{card.title}</h4>
                </div>
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
            数据来源：中国出口管制信息网、商务部安全与管制局、欧盟EUR-Lex、美国CFIUS公开记录。更新频率：每周。
          </div>
        </div>
      )}

      {/* ④ 供应链风险 */}
      {activeTab === 'supply' && (
        <div className="space-y-6">
          {/* 集中度对比图 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">关键材料集中度风险评估</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <BarChart3 className="w-4 h-4" />
                <span>CR3 = 前三企业集中度</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={supplyChainData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis dataKey="material" type="category" width={60} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'CR3集中度']} />
                <Bar dataKey="concentration" name="CR3集中度(%)" radius={[0, 4, 4, 0]}>
                  {supplyChainData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 材料详情 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">材料来源与替代方案</h3>
            <div className="space-y-4">
              {supplyChainData.map((item) => (
                <div key={item.material} className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{item.material}</span>
                      <span className="text-xs text-gray-500">主要来源: {item.source}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.risk === 'high' ? 'bg-red-100 text-red-700' :
                      item.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.riskLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <p className="text-gray-500">替代方案</p>
                      <p className="text-gray-700">{item.alternatives}</p>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>集中度</span>
                        <span className="font-medium">{item.concentration}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${item.concentration}%`, background: item.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 供应链韧性评估矩阵 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">供应链韧性评估矩阵</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">维度</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">锂</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">钴</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">镍</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">稀土</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">石墨</th>
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
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.dim}</td>
                      <td className="py-3 px-4 text-center text-amber-600">{row.li}</td>
                      <td className="py-3 px-4 text-center text-amber-600">{row.co}</td>
                      <td className="py-3 px-4 text-center text-amber-600">{row.ni}</td>
                      <td className="py-3 px-4 text-center text-amber-600">{row.re}</td>
                      <td className="py-3 px-4 text-center text-amber-600">{row.gr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">★ 越多表示该项指标越高（储量/集中度/可控度/难度/波动性）</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
            数据来源：SMM、Benchmark Minerals、USGS、中国稀土行业协会。更新频率：月度。
          </div>
        </div>
      )}
    </div>
  )
}
