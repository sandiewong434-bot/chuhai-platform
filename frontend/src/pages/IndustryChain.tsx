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
} from 'recharts'
import {
  Factory,
  Battery,
  Car,
  Zap,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

// 模拟数据 - 后续替换为API数据
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

type TabKey = 'upstream' | 'midstream' | 'downstream'

const TABS: { key: TabKey; label: string; icon: typeof Factory }[] = [
  { key: 'upstream', label: '上游·矿产原料', icon: Factory },
  { key: 'midstream', label: '中游·核心零部件', icon: Battery },
  { key: 'downstream', label: '下游·整车与应用', icon: Car },
]

export default function IndustryChain() {
  const [activeTab, setActiveTab] = useState<TabKey>('downstream')

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">产业链全景看板</h2>
        <p className="text-gray-500 mt-1">
          锂矿 → 材料 → 电池 → 整车 → 基础设施 全链路监控
        </p>
      </div>

      {/* 全链路KPI概览 */}
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

      {/* Tab切换 */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 上游 · 矿产原料 */}
      {activeTab === 'upstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                上游资源产能与产量
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={upstreamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="capacity" name="产能" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="output" name="产量" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                原材料价格走势（万元/吨）
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={priceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Line type="monotone" dataKey="lithium" name="碳酸锂" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cobalt" name="钴" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="nickel" name="镍" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">数据来源说明</p>
              <p className="text-sm text-amber-700 mt-1">
                当前展示为模拟数据。正式数据将接入 USGS、Benchmark Minerals、SMM上海有色网、
                鑫椤资讯、安泰科 等数据源。商业数据库采购完成后自动切换至真实数据。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 中游 · 核心零部件 */}
      {activeTab === 'midstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                四大材料产能占比
              </h3>
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
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {midstreamData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                动力电池企业装机量TOP榜（GWh）
              </h3>
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">数据来源说明</p>
              <p className="text-sm text-amber-700 mt-1">
                当前展示为模拟数据。正式数据将接入 高工锂电(GGII)、电池中国、
                起点锂电、赛迪研究院、SNE Research 等数据源。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 下游 · 整车与应用 */}
      {activeTab === 'downstream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                NEV销量与渗透率走势
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vehicleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="nev" name="NEV销量(万辆)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                补能设施保有量（万台/座）
              </h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              整车企业销量梯队（2026上半年）
            </h3>
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">数据来源说明</p>
              <p className="text-sm text-amber-700 mt-1">
                当前展示为模拟数据。正式数据将接入 中汽协(CAAM)、乘联会(CPCA)、
                中汽中心(CATARC)、中国充电联盟(EVCIPA)、国家能源局、IEA 等数据源。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
