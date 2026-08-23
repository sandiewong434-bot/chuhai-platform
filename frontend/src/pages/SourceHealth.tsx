import { useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react'
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

export default function SourceHealth() {
  const { data, isLoading } = useQuery<{ items?: SourceHealth[] }>({
    queryKey: ['sources-health'],
    queryFn: async () => {
      const res = await sourceApi.list()
      return res.data
    },
  })

  const { data: overview } = useQuery({
    queryKey: ['sources-overview'],
    queryFn: async () => {
      const res = await sourceApi.overview()
      return res.data
    },
  })

  const sources = data?.items || []

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
    if (!source.is_active) return 'bg-gray-50 text-gray-500'
    if (source.network_issue) return 'bg-red-50 text-red-700'
    if (source.week_count === 0) return 'bg-yellow-50 text-yellow-700'
    return 'bg-green-50 text-green-700'
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">信源监控</h2>
        <p className="text-gray-500 mt-1">信源健康度与运行状态</p>
      </div>

      {/* 概览卡片 */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">活跃信源</p>
            <p className="text-2xl font-bold text-gray-900">{overview.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">异常信源</p>
            <p className="text-2xl font-bold text-red-600">{overview.with_issue}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">覆盖库数</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Set((overview.by_library || []).map((l: {library: string}) => l.library)).size || 0}
            </p>
          </div>
        </div>
      )}

      {/* 信源列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">信源名称</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">所属库</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">层级</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">本周采集</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">最后运行</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.map((source) => (
                <tr key={source.source_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(source)}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass(source)}`}>
                        {statusText(source)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{source.name}</td>
                  <td className="px-4 py-3 text-gray-600">{source.library || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{source.crawl_tier || '-'}</td>
                  <td className="px-4 py-3 text-gray-900">{source.week_count}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {source.last_run_at
                      ? new Date(source.last_run_at).toLocaleString('zh-CN')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sources.length === 0 && !isLoading && (
          <div className="p-8 text-center text-gray-400">暂无信源数据</div>
        )}
      </div>
    </div>
  )
}
