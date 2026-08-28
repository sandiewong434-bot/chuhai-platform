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
const exportScaleData = [
  { year: '2021', total: 201.5, nev: 31.0 },
  { year: '2022', total: 311.1, nev: 67.9 },
  { year: '2023', total: 491.0, nev: 120.3 },
  { year: '2024', total: 585.9, nev: 201.0 },
  { year: '2025(预)', total: 680.0, nev: 280.0 },
]

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
  { mode: '整车出口(FOB)', desc: '直接出口整车，灵活快速', investment: 5, period: 6, risk: '低', riskColor: 'text-green-600 bg-green-50', pros: '投入低、周期短、灵活', cons: '受关税壁垒影响大' },
  { mode: 'CKD/SKD散件', desc: '出口零部件，当地组装', investment: 25, period: 12, risk: '中', riskColor: 'text-yellow-600 bg-yellow-50', pros: '规避部分关税、属地化', cons: '需当地建厂/合作' },
  { mode: '海外建厂', desc: '绿地投资或并购建厂', investment: 80, period: 36, risk: '高', riskColor: 'text-red-600 bg-red-50', pros: '绕过关税、贴近市场', cons: '投入大、周期长、政治风险' },
  { mode: '合资/技术授权', desc: '技术输出+本地生产', investment: 15, period: 18, risk: '中低', riskColor: 'text-blue-600 bg-blue-50', pros: '轻资产、共享渠道', cons: '利润分成、技术外溢风险' },
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

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">出口分析</h2>
        <p className="text-gray-500 mt-1">
          出了多少、卖到哪、谁在出、怎么出、赚不赚 — 七大维度全景分析
        </p>
      </div>

      {/* ── 核心 KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '上半年出口总量', value: '293.0万辆', sub: '同比 +25.3%', color: 'bg-blue-50 text-blue-700' },
          { label: 'NEV出口占比', value: '47.5%', sub: 'BEV+PHEV', color: 'bg-green-50 text-green-700' },
          { label: 'TOP1目的国', value: '俄罗斯', sub: '占比 18.2%', color: 'bg-purple-50 text-purple-700' },
          { label: 'TOP1出口车企', value: '奇瑞', sub: '出口 28.5万辆', color: 'bg-amber-50 text-amber-700' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${kpi.color}`}>
              {kpi.sub}
            </p>
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
      {/* ① 规模与趋势                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'scale' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                汽车出口总量与 NEV 出口走势（万辆）
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={exportScaleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="total" name="总出口" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nev" name="NEV 出口" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                2026 上半年月度出口走势（万辆）
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="exportColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="export" name="出口量" stroke="#3b82f6" fillOpacity={1} fill="url(#exportColor)" />
                </AreaChart>
              </ResponsiveContainer>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出口产品结构（动力类型）</h3>
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

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">分动力类型月度出口走势</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={vehicleTypeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bev" name="BEV" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="phev" name="PHEV" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hev" name="HEV" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="erev" name="EREV" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出口目的国 TOP10（万辆）</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topDestinations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="country" type="category" width={70} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="value" name="出口量(万辆)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">区域分布占比</h3>
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

          {/* 目的国详细表格 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">出口目的国详细数据</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">排名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">国家/地区</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">出口量(万辆)</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">占比</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">同比</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">主要出口车型</th>
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
                    <tr key={row.rank} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.rank}</td>
                      <td className="py-3 px-4 text-gray-900">{row.country}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{row.value}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{row.share}</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">{row.yoy}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{row.models}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出口企业排名（万辆）</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={brandExport} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="brand" type="category" width={90} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="export" name="出口量(万辆)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">企业出口份额占比</h3>
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
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ⑤ 出口模式                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'mode' && (
        <div className="space-y-6">
          {/* 模式占比 + 趋势 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出口模式结构占比</h3>
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

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出口模式趋势变化（%）</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={modeTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fob" name="整车出口" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ckd" name="CKD/SKD" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="plant" name="海外建厂" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="license" name="技术授权" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 模式对比矩阵 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">出口模式对比矩阵</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">出口模式</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">核心特征</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">投资额(百万美元)</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">回收周期(月)</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">风险等级</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">优势</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">劣势</th>
                  </tr>
                </thead>
                <tbody>
                  {modeCompareRows.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.mode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.desc}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">${item.investment}M</td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.period}个月</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.riskColor}`}>
                          {item.risk}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-green-600 text-xs">{item.pros}</td>
                      <td className="py-3 px-4 text-red-500 text-xs">{item.cons}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 投资规模对比 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">各模式初始投资规模对比（百万美元）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modeInvestmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis dataKey="mode" type="category" width={120} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip formatter={(value: number) => [`$${value}M`, '投资额']} />
                <Bar dataKey="investment" name="投资额(百万美元)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                中国出口汽车均价走势（万美元/辆）
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={priceTrendData}>
                  <defs>
                    <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip formatter={(value: number) => [`$${value}万`, '均价']} />
                  <Area type="monotone" dataKey="price" name="出口均价" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#priceColor)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-3">
                2020-2025 年均价从 $1.18万 提升至 $2.05万，涨幅 +73.7%，体现出口车型结构向高端化升级。
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">主要目的国单车均价对比（万美元）</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={countryPriceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="country" type="category" width={70} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip formatter={(value: number) => [`$${value}万`, '均价']} />
                  <Bar dataKey="price" name="均价(万美元)" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 出口金额与数量双轴图 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">出口金额与数量双轴走势</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {[
                { label: '2025H1 出口额', value: '$580亿', sub: '同比+31.2%', color: 'bg-blue-50 text-blue-700' },
                { label: '2025H1 出口量', value: '293万辆', sub: '同比+25.3%', color: 'bg-green-50 text-green-700' },
                { label: '单车均价', value: '$1.98万', sub: '同比+4.7%', color: 'bg-purple-50 text-purple-700' },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-lg border p-3 ${kpi.color.split(' ')[0]} border-gray-200`}>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                  <p className={`text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded ${kpi.color}`}>{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 出口附加值结构 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">出口附加值结构分析</h3>
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
                <h4 className="font-medium text-gray-900">附加值率对比</h4>
                {valueAddedData.map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-24">{item.category}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.addedRate}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.addedRate}%</span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  技术服务与品牌授权附加值率最高（75%-85%），但占比仍低；整车制造附加值率 35%，是主要出口形态。
                </p>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">贸易竞争力指数（TC 指数）趋势</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={competeIndexData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip formatter={(value: number) => [value.toFixed(2), 'TC 指数']} />
                  <Line type="monotone" dataKey="china" name="中国" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="japan" name="日本" stroke="#6b7280" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="germany" name="德国" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="korea" name="韩国" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-3">
                TC 指数 = (出口-进口)/(出口+进口)，范围[-1, 1]。中国 NEV 竞争力指数从 2020 年的 0.42 快速提升至 2025 年的 0.72，已超越日韩，接近德国水平。
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">产业链附加值分布</h3>
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

          {/* 竞争力对比矩阵 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">中国 NEV 出口竞争力对标分析</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">维度</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">中国</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">日本</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">德国</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">韩国</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">中国优劣势</th>
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
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.dim}</td>
                      <td className="py-3 px-4 text-center text-red-500 font-medium">{row.cn}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{row.jp}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{row.de}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{row.kr}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 核心结论卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: '核心优势', icon: '★', color: 'bg-green-50 border-green-200', textColor: 'text-green-700', items: ['电池产业链完整自主', '成本控制能力全球领先', '政策支持与出口退税', '三电技术迭代速度快'] },
              { title: '主要短板', icon: '⚠', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700', items: ['品牌溢价低于德系/日系', '欧美高端渠道覆盖不足', '海外售后服务网络薄弱', '芯片/操作系统仍依赖进口'] },
              { title: '突围方向', icon: '→', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', items: ['技术授权模式提升附加值', '属地化建厂绕过关税壁垒', '差异化定位避开正面竞争', '数字化服务构建用户粘性'] },
            ].map((card) => (
              <div key={card.title} className={`rounded-lg border p-5 ${card.color}`}>
                <h4 className={`font-semibold ${card.textColor} mb-3 flex items-center gap-2`}>
                  <span>{card.icon}</span>
                  {card.title}
                </h4>
                <ul className="space-y-2">
                  {card.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">数据来源说明</p>
          <p className="text-sm text-amber-700 mt-1">
            当前展示为模拟数据，仅供界面框架验证。正式数据将接入
            海关总署月度公报、中汽协出口数据、UN Comtrade、ITC Trade Map 等数据源。
            单价与竞争力指标需接入海关 HS 编码级明细后自动切换至真实数据。
          </p>
        </div>
      </div>
    </div>
  )
}
