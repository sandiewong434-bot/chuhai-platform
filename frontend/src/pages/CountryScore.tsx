import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Building2,
  ShieldAlert,
  Filter,
  ArrowUpDown,
  MapPin,
  Factory,
  Map as MapIcon,
  List,
  BarChart3,
} from 'lucide-react'
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

// 扩展至40+重点国家，带梯队标签
const COUNTRIES = [
  // 先锋市场（高潜力+高成熟度）
  { code: 'TH', name: '泰国', tier: '先锋' as const, region: '东南亚', gdp: '0.5', nev_share: '12%' },
  { code: 'HU', name: '匈牙利', tier: '先锋' as const, region: '欧洲', gdp: '0.2', nev_share: '8%' },
  { code: 'MX', name: '墨西哥', tier: '先锋' as const, region: '北美', gdp: '1.8', nev_share: '5%' },
  { code: 'ID', name: '印度尼西亚', tier: '先锋' as const, region: '东南亚', gdp: '1.4', nev_share: '3%' },
  { code: 'BR', name: '巴西', tier: '先锋' as const, region: '南美', gdp: '2.1', nev_share: '4%' },
  { code: 'TR', name: '土耳其', tier: '先锋' as const, region: '中东', gdp: '1.1', nev_share: '6%' },
  { code: 'SA', name: '沙特', tier: '先锋' as const, region: '中东', gdp: '1.1', nev_share: '2%' },
  { code: 'AE', name: '阿联酋', tier: '先锋' as const, region: '中东', gdp: '0.5', nev_share: '3%' },
  // 主力市场（中高增长）
  { code: 'VN', name: '越南', tier: '主力' as const, region: '东南亚', gdp: '0.4', nev_share: '3%' },
  { code: 'PL', name: '波兰', tier: '主力' as const, region: '欧洲', gdp: '0.8', nev_share: '5%' },
  { code: 'EG', name: '埃及', tier: '主力' as const, region: '非洲', gdp: '0.4', nev_share: '1%' },
  { code: 'ZA', name: '南非', tier: '主力' as const, region: '非洲', gdp: '0.4', nev_share: '2%' },
  { code: 'MY', name: '马来西亚', tier: '主力' as const, region: '东南亚', gdp: '0.4', nev_share: '4%' },
  { code: 'PH', name: '菲律宾', tier: '主力' as const, region: '东南亚', gdp: '0.4', nev_share: '2%' },
  { code: 'CL', name: '智利', tier: '主力' as const, region: '南美', gdp: '0.3', nev_share: '3%' },
  { code: 'PK', name: '巴基斯坦', tier: '主力' as const, region: '南亚', gdp: '0.3', nev_share: '1%' },
  { code: 'BD', name: '孟加拉', tier: '主力' as const, region: '南亚', gdp: '0.4', nev_share: '0.5%' },
  { code: 'NG', name: '尼日利亚', tier: '主力' as const, region: '非洲', gdp: '0.4', nev_share: '0.3%' },
  { code: 'KZ', name: '哈萨克斯坦', tier: '主力' as const, region: '中亚', gdp: '0.3', nev_share: '1%' },
  { code: 'UA', name: '乌兹别克斯坦', tier: '主力' as const, region: '中亚', gdp: '0.1', nev_share: '0.5%' },
  // 潜力市场（高增长空间）
  { code: 'IN', name: '印度', tier: '潜力' as const, region: '南亚', gdp: '3.7', nev_share: '2%' },
  { code: 'RU', name: '俄罗斯', tier: '潜力' as const, region: '欧洲', gdp: '2.0', nev_share: '5%' },
  { code: 'AU', name: '澳大利亚', tier: '潜力' as const, region: '大洋洲', gdp: '1.7', nev_share: '8%' },
  { code: 'GB', name: '英国', tier: '潜力' as const, region: '欧洲', gdp: '3.3', nev_share: '15%' },
  { code: 'BE', name: '比利时', tier: '潜力' as const, region: '欧洲', gdp: '0.6', nev_share: '12%' },
  { code: 'DE', name: '德国', tier: '潜力' as const, region: '欧洲', gdp: '4.5', nev_share: '18%' },
  { code: 'FR', name: '法国', tier: '潜力' as const, region: '欧洲', gdp: '3.0', nev_share: '16%' },
  { code: 'NL', name: '荷兰', tier: '潜力' as const, region: '欧洲', gdp: '1.1', nev_share: '20%' },
  { code: 'ES', name: '西班牙', tier: '潜力' as const, region: '欧洲', gdp: '1.6', nev_share: '10%' },
  { code: 'IT', name: '意大利', tier: '潜力' as const, region: '欧洲', gdp: '2.2', nev_share: '9%' },
  { code: 'AR', name: '阿根廷', tier: '潜力' as const, region: '南美', gdp: '0.5', nev_share: '1%' },
  { code: 'CO', name: '哥伦比亚', tier: '潜力' as const, region: '南美', gdp: '0.4', nev_share: '2%' },
  { code: 'KE', name: '肯尼亚', tier: '潜力' as const, region: '非洲', gdp: '0.1', nev_share: '0.5%' },
  { code: 'MA', name: '摩洛哥', tier: '潜力' as const, region: '非洲', gdp: '0.1', nev_share: '2%' },
  { code: 'PE', name: '秘鲁', tier: '潜力' as const, region: '南美', gdp: '0.3', nev_share: '1%' },
  // 待观察
  { code: 'US', name: '美国', tier: '待观察' as const, region: '北美', gdp: '27', nev_share: '8%' },
  { code: 'JP', name: '日本', tier: '待观察' as const, region: '东亚', gdp: '4.2', nev_share: '3%' },
  { code: 'KR', name: '韩国', tier: '待观察' as const, region: '东亚', gdp: '1.7', nev_share: '5%' },
  { code: 'CA', name: '加拿大', tier: '待观察' as const, region: '北美', gdp: '2.1', nev_share: '6%' },
  { code: 'SE', name: '瑞典', tier: '待观察' as const, region: '欧洲', gdp: '0.6', nev_share: '35%' },
  { code: 'NO', name: '挪威', tier: '待观察' as const, region: '欧洲', gdp: '0.5', nev_share: '82%' },
  { code: 'FI', name: '芬兰', tier: '待观察' as const, region: '欧洲', gdp: '0.3', nev_share: '25%' },
  { code: 'DK', name: '丹麦', tier: '待观察' as const, region: '欧洲', gdp: '0.4', nev_share: '40%' },
  { code: 'AT', name: '奥地利', tier: '待观察' as const, region: '欧洲', gdp: '0.5', nev_share: '15%' },
  { code: 'CH', name: '瑞士', tier: '待观察' as const, region: '欧洲', gdp: '0.9', nev_share: '18%' },
]

type Tier = '先锋' | '主力' | '潜力' | '待观察'
type SortKey = 'score' | 'name' | 'tier'
type ViewMode = 'list' | 'map' | 'detail'

const tierConfig: Record<Tier, { color: string; bg: string; border: string; desc: string; mapColor: string }> = {
  '先锋': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', desc: '高成熟度+高潜力，优先进入', mapColor: '#059669' },
  '主力': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: '中高增长，重点布局', mapColor: '#2563eb' },
  '潜力': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', desc: '高增长空间，战略布局', mapColor: '#7c3aed' },
  '待观察': { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', desc: '壁垒较高或市场成熟，择机进入', mapColor: '#9ca3af' },
}

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

// 确定性评分生成：基于梯队+国家代码哈希，保证每次加载一致
function hashNum(str: string, seed: number): number {
  let h = seed
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getDimScore(countryCode: string, base: number, dimIdx: number): number {
  const offset = (hashNum(countryCode, dimIdx * 7) % 21) - 10 // -10 ~ +10
  return Math.min(100, Math.max(0, base + offset))
}

const mockScores: Record<string, ScoreResult> = {}
COUNTRIES.forEach((c) => {
  const base = c.tier === '先锋' ? 82 : c.tier === '主力' ? 70 : c.tier === '潜力' ? 60 : 48
  const dims = {
    d1: getDimScore(c.code, base, 1),
    d2: getDimScore(c.code, base, 2),
    d3: getDimScore(c.code, base, 3),
    d4: getDimScore(c.code, base, 4),
    d5: getDimScore(c.code, base, 5),
    d6: getDimScore(c.code, base, 6),
  }
  const weighted = DIMENSIONS.reduce((sum, dim) => sum + (dims[dim.key as keyof typeof dims] * dim.weight), 0)
  const total = Math.round(weighted)
  mockScores[c.code] = {
    country_code: c.code,
    country_name: c.name,
    industry: 'NEV',
    score_total: total,
    score_level: total >= 85 ? '强烈推荐' : total >= 75 ? '推荐' : total >= 60 ? '谨慎推荐' : total >= 40 ? '不推荐' : '暂不推荐',
    dimensions: dims,
    scored_at: '2026-08-20',
  }
})

// 注册世界地图
let mapRegistered = false

export default function CountryScore() {
  const [selectedCountry, setSelectedCountry] = useState('TH')
  const [industry] = useState('NEV')
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [mapReady, setMapReady] = useState(false)

  // 加载并注册世界地图
  useEffect(() => {
    if (mapRegistered) {
      setMapReady(true)
      return
    }
    fetch('/maps/world.json')
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('world', geoJson)
        mapRegistered = true
        setMapReady(true)
      })
      .catch((err) => {
        console.error('Failed to load world map:', err)
      })
  }, [])

  const { data: apiScore } = useQuery<ScoreResult>({
    queryKey: ['score', selectedCountry, industry],
    queryFn: async () => {
      try {
        const res = await scoreApi.calculate({
          country_code: selectedCountry,
          industry,
        })
        return res.data
      } catch {
        return undefined
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  const score = apiScore || mockScores[selectedCountry]

  const filteredCountries = useMemo(() => {
    let list = COUNTRIES
    if (tierFilter !== 'all') {
      list = list.filter((c) => c.tier === tierFilter)
    }
    if (sortBy === 'score') {
      list = [...list].sort((a, b) => (mockScores[b.code]?.score_total || 0) - (mockScores[a.code]?.score_total || 0))
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [tierFilter, sortBy])

  const tierStats = useMemo(() => {
    return {
      先锋: COUNTRIES.filter((c) => c.tier === '先锋').length,
      主力: COUNTRIES.filter((c) => c.tier === '主力').length,
      潜力: COUNTRIES.filter((c) => c.tier === '潜力').length,
      待观察: COUNTRIES.filter((c) => c.tier === '待观察').length,
    }
  }, [])

  // 地图配置
  const mapOption = useMemo(() => {
    const mapData = COUNTRIES.map((c) => ({
      name: c.code,
      value: mockScores[c.code]?.score_total || 0,
      tier: c.tier,
      countryName: c.name,
      itemStyle: {
        areaColor: tierConfig[c.tier].mapColor,
        borderColor: '#fff',
        borderWidth: 0.5,
      },
      emphasis: {
        itemStyle: {
          areaColor: '#f59e0b',
          borderColor: '#fff',
          borderWidth: 1.5,
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)',
        },
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#1f2937',
        },
      },
    }))

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#1f2937', fontSize: 13 },
        formatter: (params: any) => {
          if (!params.data) return params.name
          const data = params.data
          const cfg = tierConfig[data.tier as Tier]
          return `
            <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${data.countryName}</div>
            <div style="color:#6b7280;font-size:12px">梯队：<span style="color:${cfg.mapColor};font-weight:600">${data.tier}</span></div>
            <div style="color:#6b7280;font-size:12px">综合评分：<span style="color:#1f2937;font-weight:600">${data.value}分</span></div>
            <div style="color:#6b7280;font-size:12px;margin-top:4px">点击查看详情 →</div>
          `
        },
      },
      visualMap: {
        show: false,
      },
      geo: {
        map: 'world',
        roam: true,
        zoom: 1.2,
        center: [20, 20],
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: '#f3f4f6',
          borderColor: '#d1d5db',
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#e5e7eb',
          },
        },
      },
      series: [
        {
          type: 'map',
          map: 'world',
          geoIndex: 0,
          data: mapData,
          select: {
            disabled: true,
          },
        },
      ],
    }
  }, [])

  const onMapClick = useCallback((params: any) => {
    if (params?.data?.name) {
      const code = params.data.name as string
      setSelectedCountry(code)
      setViewMode('detail')
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">目标市场筛选与国别分级</h2>
        <p className="text-gray-500 mt-1">
          先锋 / 主力 / 潜力 / 待观察 四级梯队 · {COUNTRIES.length}个重点国家
        </p>
      </div>

      {/* 梯队统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(tierConfig) as Tier[]).map((tier) => (
          <button
            key={tier}
            onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
            className={`p-4 rounded-lg border text-left transition-all ${
              tierFilter === tier
                ? tierConfig[tier].bg + ' ' + tierConfig[tier].border + ' ring-2 ring-offset-1'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${tierConfig[tier].color}`}>{tier}市场</span>
              <span className="text-2xl font-bold text-gray-900">{tierStats[tier]}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{tierConfig[tier].desc}</p>
          </button>
        ))}
      </div>

      {/* 筛选、排序与视图切换 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">筛选:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as Tier | 'all')}
            className="text-sm border-none bg-transparent focus:ring-0 text-gray-700"
          >
            <option value="all">全部梯队</option>
            <option value="先锋">先锋市场</option>
            <option value="主力">主力市场</option>
            <option value="潜力">潜力市场</option>
            <option value="待观察">待观察</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border-none bg-transparent focus:ring-0 text-gray-700"
          >
            <option value="score">按评分</option>
            <option value="name">按名称</option>
            <option value="tier">按梯队</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            地图视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
            列表视图
          </button>
          <button
            onClick={() => { setSelectedCountry('TH'); setViewMode('detail') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            详情视图
          </button>
        </div>
      </div>

      {/* 地图视图 */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-gray-500" />
              全球市场梯队分布
            </h3>
            <div className="flex items-center gap-3 text-xs">
              {(Object.keys(tierConfig) as Tier[]).map((tier) => (
                <span key={tier} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ backgroundColor: tierConfig[tier].mapColor }}
                  />
                  {tier}
                </span>
              ))}
            </div>
          </div>
          <div className="relative" style={{ height: 520 }}>
            {mapReady ? (
              <ReactECharts
                option={mapOption}
                style={{ height: '100%', width: '100%' }}
                onEvents={{
                  click: onMapClick,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Globe className="w-10 h-10 mx-auto mb-3 text-gray-300 animate-pulse" />
                  <p className="text-sm">地图加载中...</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            提示：鼠标悬停查看国家评分，点击国家区域下钻到详情页。支持鼠标滚轮缩放和拖拽平移。
          </div>
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">排名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">国家</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">梯队</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">区域</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">综合评分</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">评级</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">GDP(万亿)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">NEV渗透率</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCountries.map((c, idx) => {
                  const s = mockScores[c.code]
                  const cfg = tierConfig[c.tier]
                  return (
                    <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {c.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          {c.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{c.region}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-gray-900">{s?.score_total || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(s?.score_level || '')}`}>
                          {s?.score_level || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">${c.gdp}T</td>
                      <td className="py-3 px-4 text-right text-gray-600">{c.nev_share}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => { setSelectedCountry(c.code); setViewMode('detail') }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 详情视图 */}
      {viewMode === 'detail' && score && (
        <div className="space-y-6">
          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => setViewMode('map')}
              className="hover:text-blue-600 transition-colors"
            >
              国别分级
            </button>
            <span>/</span>
            <span className="font-medium text-gray-900">{score.country_name}</span>
          </div>

          {/* 国家切换 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700">选择国家</label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：总分+梯队标签 */}
            <div className="space-y-4">
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

              {/* 梯队标签 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-3">市场梯队</h3>
                {(() => {
                  const c = COUNTRIES.find((x) => x.code === selectedCountry)
                  const cfg = c ? tierConfig[c.tier] : tierConfig['待观察']
                  return (
                    <div className={`p-4 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center gap-2">
                        <Star className={`w-5 h-5 ${cfg.color}`} />
                        <span className={`font-bold ${cfg.color}`}>{c?.tier || '待观察'}市场</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{cfg.desc}</p>
                    </div>
                  )
                })()}
              </div>

              {/* 三维度卡片 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-3">关键维度速览</h3>
                <div className="space-y-3">
                  {[
                    { label: '营商环境', icon: Building2, score: score.dimensions.d6, color: 'bg-blue-500' },
                    { label: '产业配套', icon: Factory, score: score.dimensions.d5, color: 'bg-green-500' },
                    { label: '政治风险', icon: ShieldAlert, score: score.dimensions.d4, color: 'bg-amber-500' },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-md ${dim.score >= 60 ? 'bg-green-100' : dim.score >= 40 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                        <dim.icon className={`w-4 h-4 ${dim.score >= 60 ? 'text-green-600' : dim.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                          <span className="text-sm font-bold text-gray-900">{dim.score}分</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1.5">
                          <div className={`h-1.5 rounded-full ${dim.color}`} style={{ width: `${dim.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧：雷达图 + 条形图 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 雷达图 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">六维度雷达图</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={DIMENSIONS.map((dim) => ({
                        subject: dim.name.replace(/与.*/, '…'),
                        score: score.dimensions[dim.key as keyof typeof score.dimensions] || 0,
                        fullMark: 100,
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name={score.country_name}
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 条形图明细 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">子项明细</h3>
                <div className="space-y-3">
                  {DIMENSIONS.map((dim) => {
                    const value = score.dimensions[dim.key as keyof typeof score.dimensions] || 0
                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{dim.name}</span>
                          <span className="text-sm font-medium text-gray-900">{value}分</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
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
          </div>
        </div>
      )}

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
