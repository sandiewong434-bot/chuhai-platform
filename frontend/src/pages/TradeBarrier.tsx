import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, Search, Filter, AlertTriangle } from 'lucide-react'
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

export default function TradeBarrier() {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [onlyNEV, setOnlyNEV] = useState(false)

  const { data, isLoading } = useQuery<BarrierListData>({
    queryKey: ['barriers', q, typeFilter, statusFilter, onlyNEV],
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">贸易壁垒</h2>
        <p className="text-gray-500 mt-1">贸易救济案件查询与 NEV 高亮</p>
      </div>

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={() => { setQ(''); setTypeFilter(''); setStatusFilter(''); setOnlyNEV(false) }}
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {c.title}
                    </h3>
                    {c.nev_related && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        NEV
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {c.country}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                      {c.type}
                    </span>
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded">
                      {c.status}
                    </span>
                    <span className="text-gray-400">{c.date || '日期未知'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
