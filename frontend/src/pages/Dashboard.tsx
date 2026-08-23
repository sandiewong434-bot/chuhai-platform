import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Globe, Radio, TrendingUp } from 'lucide-react'
import { articleApi, sourceApi, scoreApi } from '@/lib/api'

interface Stats {
  totalArticles: number
  weeklyArticles: number
  activeSources: number
  issueSources: number
  countryCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    weeklyArticles: 0,
    activeSources: 0,
    issueSources: 0,
    countryCount: 0,
  })

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-gray-500 mt-1">出海综合服务平台数据概览</p>
      </div>

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
