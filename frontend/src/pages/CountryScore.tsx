import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { scoreApi } from '@/lib/api'

interface ScoreResult {
  country_code: string
  country_name: string
  industry: string
  score_total: number
  score_level: string
  dimensions: {
    d1: number
    d2: number
    d3: number
    d4: number
    d5: number
    d6: number
  }
  scored_at: string
}

const DIMENSIONS = [
  { key: 'd1', name: '海外布局现状与趋势', weight: 0.15 },
  { key: 'd2', name: '与中国的双边关系', weight: 0.20 },
  { key: 'd3', name: '与美国及盟友的关系', weight: 0.15 },
  { key: 'd4', name: '政治稳定性与政权连续性', weight: 0.15 },
  { key: 'd5', name: '产业基础与配套能力', weight: 0.20 },
  { key: 'd6', name: '营商环境与合规要求', weight: 0.15 },
]

const DEMO_COUNTRIES = [
  { code: 'TH', name: '泰国' },
  { code: 'ID', name: '印度尼西亚' },
  { code: 'HU', name: '匈牙利' },
  { code: 'VN', name: '越南' },
  { code: 'MX', name: '墨西哥' },
  { code: 'BR', name: '巴西' },
  { code: 'TR', name: '土耳其' },
  { code: 'EG', name: '埃及' },
]

export default function CountryScore() {
  const [selectedCountry, setSelectedCountry] = useState('TH')
  const [industry] = useState('NEV')

  const { data: score, isLoading } = useQuery<ScoreResult>({
    queryKey: ['score', selectedCountry, industry],
    queryFn: async () => {
      const res = await scoreApi.calculate({
        country_code: selectedCountry,
        industry,
      })
      return res.data
    },
  })

  const levelColor = (level: string) => {
    const map: Record<string, string> = {
      '强烈推荐': 'text-green-600 bg-green-50',
      '推荐': 'text-blue-600 bg-blue-50',
      '谨慎推荐': 'text-yellow-600 bg-yellow-50',
      '不推荐': 'text-orange-600 bg-orange-50',
      '暂不推荐': 'text-red-600 bg-red-50',
    }
    return map[level] || 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">国别评估</h2>
        <p className="text-gray-500 mt-1">基于引擎三的六国别评分模型</p>
      </div>

      {/* 国家选择 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="text-sm font-medium text-gray-700">选择国家</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {DEMO_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCountry === c.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">计算中...</div>
      ) : score ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 总分卡片 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">综合评分</h3>
            </div>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-gray-900">
                {score.score_total}
              </div>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColor(score.score_level)}`}>
                  {score.score_level}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {score.country_name} · {score.industry}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                评分日期: {score.scored_at}
              </p>
            </div>
          </div>

          {/* 维度雷达图（简化版：条形图） */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">六维度得分</h3>
            <div className="space-y-4">
              {DIMENSIONS.map((dim) => {
                const value = score.dimensions[dim.key as keyof typeof score.dimensions] || 0
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{dim.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {value}分
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          value >= 80
                            ? 'bg-green-500'
                            : value >= 60
                            ? 'bg-blue-500'
                            : value >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* 评分说明 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">评分等级说明</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { level: '强烈推荐', range: '90-100', icon: TrendingUp, color: 'text-green-600' },
            { level: '推荐', range: '75-89', icon: TrendingUp, color: 'text-blue-600' },
            { level: '谨慎推荐', range: '60-74', icon: Minus, color: 'text-yellow-600' },
            { level: '不推荐', range: '40-59', icon: TrendingDown, color: 'text-orange-600' },
            { level: '暂不推荐', range: '0-39', icon: TrendingDown, color: 'text-red-600' },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.level}</p>
                <p className="text-xs text-gray-500">{item.range}分</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
