import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Globe, Radio, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { articleApi, sourceApi, scoreApi } from '@/lib/api'

interface Stats {
  totalArticles: number
  weeklyArticles: number
  activeSources: number
  issueSources: number
  countryCount: number
}

interface DailyData {
  date: string
  count: number
}

interface SourceData {
  name: string
  count: number
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    weeklyArticles: 0,
    activeSources: 0,
    issueSources: 0,
    countryCount: 0,
  })
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [topSources, setTopSources] = useState<SourceData[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [articleRes, sourceRes, countryRes] = await Promise.all([
          articleApi.stats(7),
          sourceApi.overview(),
          scoreApi.countries(),
        ])
        setStats({
          totalArticles: articleRes.data.total || 0,
          weeklyArticles: articleRes.data.total || 0,
          activeSources: sourceRes.data.active || 0,
          issueSources: sourceRes.data.with_issue || 0,
          countryCount: countryRes?.data?.total || 0,
        })
        setDailyData(articleRes.data.daily || [])
        setTopSources((articleRes.data.by_source || []).slice(0, 6))
      } catch {
        // 静默失败，使用默认值
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: '本周新增文章',
      value: stats.weeklyArticles,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/articles',
    },
    {
      title: '活跃信源',
      value: stats.activeSources,
      icon: Radio,
      color: 'text-green-600',
      bg: 'bg-green-50',
      link: '/sources',
    },
    {
      title: '异常信源',
      value: stats.issueSources,
      icon: TrendingUp,
      color: 'text-red-600',
      bg: 'bg-red-50',
      link: '/sources',
    },
    {
      title: '覆盖国家/地区',
      value: stats.countryCount,
      icon: Globe,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      link: '/scores',
    },
  ]

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-gray-500 mt-1">出海综合服务平台数据概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 文章趋势图 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近7天文章采集趋势</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} 篇`, '文章数']}
                  labelFormatter={(label: string) => `日期: ${label}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              暂无趋势数据
            </div>
          )}
        </div>

        {/* 来源分布图 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近7天文章来源分布</h3>
          {topSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={topSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                >
                  {topSources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} 篇`, name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              暂无来源数据
            </div>
          )}
        </div>
      </div>

      {/* 快速入口 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速入口</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: '文章检索', desc: '全文搜索与多维筛选', to: '/articles' },
            { label: '本体图谱', desc: '企业与关系网络可视化', to: '/ontology' },
            { label: '国别评估', desc: '雷达图与评分等级', to: '/scores' },
            { label: '贸易壁垒', desc: '案件查询与时间线', to: '/barriers' },
            { label: '企业追踪', desc: '出海动态与投资建厂', to: '/enterprises' },
            { label: '信源监控', desc: '健康度与运行日志', to: '/sources' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
