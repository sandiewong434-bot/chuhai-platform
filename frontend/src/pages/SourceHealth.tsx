import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle, AlertCircle, XCircle, Clock, Wifi,
  Database, TrendingUp, TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { sourceApi } from '@/lib/api'

interface SourceHealth {
  source_id: number
  name: string
  is_active: boolean
  library: string | null
  crawl_tier: string | null
  network_issue: boolean
  last_run_at: string | null
  last_new_count: number
  week_count: number
}

// 模拟信源数据
const MOCK_SOURCES: SourceHealth[] = [
  { source_id: 1, name: '巨潮资讯网', is_active: true, library: 'L1出海动态', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T06:00:00Z', last_new_count: 12, week_count: 89 },
  { source_id: 2, name: '商务部对外投资', is_active: true, library: 'L5政策法规', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T05:30:00Z', last_new_count: 3, week_count: 21 },
  { source_id: 3, name: '中国贸易救济信息网', is_active: true, library: 'L9贸易壁垒', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T04:00:00Z', last_new_count: 5, week_count: 34 },
  { source_id: 4, name: '欧盟EUR-Lex', is_active: true, library: 'L5政策法规', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T03:00:00Z', last_new_count: 2, week_count: 15 },
  { source_id: 5, name: '美国USTR', is_active: true, library: 'L5政策法规', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T02:00:00Z', last_new_count: 1, week_count: 8 },
  { source_id: 6, name: 'S&P Global', is_active: true, library: 'L4市场数据', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T22:00:00Z', last_new_count: 0, week_count: 45 },
  { source_id: 7, name: 'CleanTechnica', is_active: true, library: 'L2行业资讯', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T01:00:00Z', last_new_count: 4, week_count: 28 },
  { source_id: 8, name: 'Electrive', is_active: true, library: 'L2行业资讯', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T00:30:00Z', last_new_count: 3, week_count: 22 },
  { source_id: 9, name: 'InsideEVs', is_active: true, library: 'L2行业资讯', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T23:00:00Z', last_new_count: 0, week_count: 18 },
  { source_id: 10, name: '泰国投资促进局BOI', is_active: true, library: 'L5政策法规', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-27T20:00:00Z', last_new_count: 1, week_count: 7 },
  { source_id: 11, name: '印尼BKPM', is_active: true, library: 'L5政策法规', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-27T18:00:00Z', last_new_count: 0, week_count: 5 },
  { source_id: 12, name: '巴西Anfavea', is_active: true, library: 'L4市场数据', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-27T16:00:00Z', last_new_count: 2, week_count: 12 },
  { source_id: 13, name: '欧洲汽车制造商协会ACEA', is_active: true, library: 'L4市场数据', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-27T14:00:00Z', last_new_count: 1, week_count: 9 },
  { source_id: 14, name: '中国汽车工业协会CAAM', is_active: true, library: 'L4市场数据', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T06:30:00Z', last_new_count: 8, week_count: 56 },
  { source_id: 15, name: '乘联会CPCA', is_active: true, library: 'L4市场数据', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T07:00:00Z', last_new_count: 15, week_count: 102 },
  { source_id: 16, name: '路透社Reuters', is_active: true, library: 'L2行业资讯', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T05:00:00Z', last_new_count: 6, week_count: 42 },
  { source_id: 17, name: '彭博Bloomberg', is_active: true, library: 'L2行业资讯', crawl_tier: 'P2', network_issue: true, last_run_at: '2026-08-26T10:00:00Z', last_new_count: 0, week_count: 0 },
  { source_id: 18, name: '华尔街日报WSJ', is_active: false, library: 'L2行业资讯', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-20T08:00:00Z', last_new_count: 0, week_count: 0 },
  { source_id: 19, name: '港口网', is_active: true, library: 'L8港口物流', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T12:00:00Z', last_new_count: 0, week_count: 14 },
  { source_id: 20, name: '中国航运数据库', is_active: true, library: 'L8港口物流', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T10:00:00Z', last_new_count: 0, week_count: 8 },
  { source_id: 21, name: 'Wind资讯', is_active: true, library: 'L4市场数据', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T06:15:00Z', last_new_count: 20, week_count: 145 },
  { source_id: 22, name: '同花顺iFinD', is_active: true, library: 'L4市场数据', crawl_tier: 'P0', network_issue: false, last_run_at: '2026-08-28T06:20:00Z', last_new_count: 18, week_count: 132 },
  { source_id: 23, name: '财新数据', is_active: true, library: 'L4市场数据', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T05:45:00Z', last_new_count: 5, week_count: 38 },
  { source_id: 24, name: '盖世汽车', is_active: true, library: 'L3产业链', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T04:30:00Z', last_new_count: 3, week_count: 25 },
  { source_id: 25, name: '高工锂电', is_active: true, library: 'L3产业链', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T03:30:00Z', last_new_count: 2, week_count: 19 },
  { source_id: 26, name: '电池中国', is_active: true, library: 'L3产业链', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T21:00:00Z', last_new_count: 0, week_count: 11 },
  { source_id: 27, name: '泰国海关', is_active: true, library: 'L4市场数据', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T15:00:00Z', last_new_count: 1, week_count: 6 },
  { source_id: 28, name: '印尼统计局BPS', is_active: true, library: 'L4市场数据', crawl_tier: 'P2', network_issue: true, last_run_at: '2026-08-25T09:00:00Z', last_new_count: 0, week_count: 2 },
  { source_id: 29, name: '土耳其统计局TURKSTAT', is_active: true, library: 'L4市场数据', crawl_tier: 'P2', network_issue: false, last_run_at: '2026-08-27T11:00:00Z', last_new_count: 0, week_count: 4 },
  { source_id: 30, name: '匈牙利投资促进局HIPA', is_active: true, library: 'L5政策法规', crawl_tier: 'P1', network_issue: false, last_run_at: '2026-08-28T02:30:00Z', last_new_count: 1, week_count: 6 },
]

const LIBRARY_LABELS: Record<string, string> = {
  'L1出海动态': '出海动态',
  'L2行业资讯': '行业资讯',
  'L3产业链': '产业链',
  'L4市场数据': '市场数据',
  'L5政策法规': '政策法规',
  'L8港口物流': '港口物流',
  'L9贸易壁垒': '贸易壁垒',
}

export default function SourceHealth() {
  const [libraryFilter, setLibraryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useQuery<{ items?: SourceHealth[] }>({
    queryKey: ['sources-health'],
    queryFn: async () => {
      try {
        const res = await sourceApi.list()
        return res.data
      } catch {
        return { items: MOCK_SOURCES }
      }
    },
  })

  useQuery({
    queryKey: ['sources-overview'],
    queryFn: async () => {
      try {
        const res = await sourceApi.overview()
        return res.data
      } catch {
        return {
          total: MOCK_SOURCES.filter((s) => s.is_active).length,
          with_issue: MOCK_SOURCES.filter((s) => s.network_issue).length,
          by_library: Object.entries(
            MOCK_SOURCES.reduce((acc, s) => {
              const lib = s.library || '未分类'
              if (!acc[lib]) acc[lib] = { library: lib, count: 0, active: 0 }
              acc[lib].count++
              if (s.is_active) acc[lib].active++
              return acc
            }, {} as Record<string, { library: string; count: number; active: number }>)
          ).map(([, v]) => v),
        }
      }
    },
  })

  const sources = data?.items || MOCK_SOURCES

  // 筛选
  let filtered = sources
  if (libraryFilter) {
    filtered = filtered.filter((s) => s.library === libraryFilter)
  }
  if (statusFilter) {
    if (statusFilter === 'normal') filtered = filtered.filter((s) => s.is_active && !s.network_issue && s.week_count > 0)
    else if (statusFilter === 'issue') filtered = filtered.filter((s) => s.network_issue)
    else if (statusFilter === 'silent') filtered = filtered.filter((s) => s.is_active && !s.network_issue && s.week_count === 0)
    else if (statusFilter === 'inactive') filtered = filtered.filter((s) => !s.is_active)
  }

  const statusIcon = (source: SourceHealth) => {
    if (!source.is_active) return <XCircle className="w-5 h-5 text-gray-400" />
    if (source.network_issue) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (source.week_count === 0) return <Clock className="w-5 h-5 text-yellow-500" />
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  const statusText = (source: SourceHealth) => {
    if (!source.is_active) return '已停用'
    if (source.network_issue) return '异常'
    if (source.week_count === 0) return '无更新'
    return '正常'
  }

  const statusClass = (source: SourceHealth) => {
    if (!source.is_active) return 'bg-gray-50 text-gray-500 border-gray-200'
    if (source.network_issue) return 'bg-red-50 text-red-700 border-red-200'
    if (source.week_count === 0) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  // 按库分组统计
  const libraryStats = sources.reduce((acc, s) => {
    const lib = s.library || '未分类'
    if (!acc[lib]) acc[lib] = { total: 0, active: 0, issue: 0 }
    acc[lib].total++
    if (s.is_active) acc[lib].active++
    if (s.network_issue) acc[lib].issue++
    return acc
  }, {} as Record<string, { total: number; active: number; issue: number }>)


  const totalCount = sources.filter((s) => s.is_active).length
  const issueCount = sources.filter((s) => s.network_issue).length
  const silentCount = sources.filter((s) => s.is_active && !s.network_issue && s.week_count === 0).length
  const totalWeekArticles = sources.reduce((sum, s) => sum + s.week_count, 0)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">信源监控</h2>
        <p className="text-gray-500 mt-1">信源健康度 · 运行状态 · 采集统计</p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">活跃信源</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
          <p className="text-xs text-gray-400">/ {sources.length} 总计</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">异常信源</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{issueCount}</p>
          <p className="text-xs text-gray-400">网络或访问故障</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500">静默信源</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{silentCount}</p>
          <p className="text-xs text-gray-400">本周无新数据</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">本周采集</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalWeekArticles}</p>
          <p className="text-xs text-gray-400">文章/条</p>
        </div>
      </div>

      {/* 库别分布 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(libraryStats).map(([lib, stats]) => (
          <button
            key={lib}
            onClick={() => setLibraryFilter(libraryFilter === lib ? '' : lib)}
            className={`p-3 rounded-lg border text-left transition-all ${
              libraryFilter === lib ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-gray-500">{LIBRARY_LABELS[lib] || lib}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-gray-900">{stats.active}</span>
              <span className="text-xs text-gray-400">/ {stats.total}</span>
            </div>
            {stats.issue > 0 && (
              <p className="text-xs text-red-500 mt-0.5">{stats.issue}个异常</p>
            )}
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            statusFilter === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          全部状态
        </button>
        <button
          onClick={() => setStatusFilter('normal')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
            statusFilter === 'normal' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <CheckCircle className="w-3 h-3" /> 正常
        </button>
        <button
          onClick={() => setStatusFilter('issue')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
            statusFilter === 'issue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <AlertCircle className="w-3 h-3" /> 异常
        </button>
        <button
          onClick={() => setStatusFilter('silent')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
            statusFilter === 'silent' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <Clock className="w-3 h-3" /> 无更新
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
            statusFilter === 'inactive' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <XCircle className="w-3 h-3" /> 已停用
        </button>
        {libraryFilter && (
          <button
            onClick={() => setLibraryFilter('')}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            {LIBRARY_LABELS[libraryFilter] || libraryFilter} ×
          </button>
        )}
      </div>

      {/* 信源列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">信源名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">所属库</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">层级</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">本周采集</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">上次新增</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">最后运行</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((source) => (
                  <tr key={source.source_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {statusIcon(source)}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusClass(source)}`}>
                          {statusText(source)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{source.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {LIBRARY_LABELS[source.library || ''] || source.library || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        source.crawl_tier === 'P0' ? 'bg-red-50 text-red-700' :
                        source.crawl_tier === 'P1' ? 'bg-orange-50 text-orange-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {source.crawl_tier || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {source.week_count > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="font-medium text-gray-900">{source.week_count}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-400">0</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {source.last_new_count > 0 ? (
                        <span className="text-green-600 font-medium">+{source.last_new_count}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {source.last_run_at
                          ? new Date(source.last_run_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="p-8 text-center text-gray-400">暂无符合条件的信源</div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
        监控说明：信源每2-6小时自动采集一次。异常信源将在30分钟内触发告警。P0级信源为核心信源，P1为重要信源，P2为辅助信源。
      </div>
    </div>
  )
}
