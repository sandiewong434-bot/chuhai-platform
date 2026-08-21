import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { articleApi } from '@/lib/api'

interface Article {
  id: number
  title: string
  source_name: string
  publish_date: string | null
  category_layer: string | null
  relevance: string | null
}

interface ArticleListData {
  total: number
  items: Article[]
}

export default function ArticleList() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [layer, setLayer] = useState('')
  const [relevance, setRelevance] = useState('')
  const size = 20

  const { data, isLoading } = useQuery<ArticleListData>({
    queryKey: ['articles', page, q, layer, relevance],
    queryFn: async () => {
      const res = await articleApi.list({
        page,
        size,
        q: q || undefined,
        layer: layer || undefined,
        relevance: relevance || undefined,
      })
      return res.data
    },
  })

  const totalPages = data ? Math.ceil(data.total / size) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">文章检索</h2>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索标题或正文..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => { setQ(''); setLayer(''); setRelevance(''); setPage(1) }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={layer}
            onChange={(e) => { setLayer(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部层级</option>
            <option value="enterprise">企业级</option>
            <option value="industry">行业级</option>
            <option value="nation">国家级</option>
            <option value="none">无</option>
          </select>

          <select
            value={relevance}
            onChange={(e) => { setRelevance(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部相关度</option>
            <option value="direct">直接相关</option>
            <option value="industry">行业相关</option>
            <option value="unrelated">不相关</option>
          </select>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : !data?.items.length ? (
          <div className="p-8 text-center text-gray-500">暂无数据</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">标题</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 w-32">来源</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 w-28">发布日期</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 w-24">层级</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 w-24">相关度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/articles/${article.id}`}
                        className="text-blue-600 hover:underline line-clamp-1"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{article.source_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {article.publish_date || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <LayerBadge layer={article.category_layer} />
                    </td>
                    <td className="px-4 py-3">
                      <RelevanceBadge relevance={article.relevance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 分页 */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                共 {data.total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LayerBadge({ layer }: { layer: string | null }) {
  const styles: Record<string, string> = {
    enterprise: 'bg-blue-50 text-blue-700',
    industry: 'bg-green-50 text-green-700',
    nation: 'bg-purple-50 text-purple-700',
    none: 'bg-gray-50 text-gray-600',
  }
  const labels: Record<string, string> = {
    enterprise: '企业',
    industry: '行业',
    nation: '国家',
    none: '无',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[layer || 'none']}`}>
      {labels[layer || 'none']}
    </span>
  )
}

function RelevanceBadge({ relevance }: { relevance: string | null }) {
  const styles: Record<string, string> = {
    direct: 'bg-red-50 text-red-700',
    industry: 'bg-yellow-50 text-yellow-700',
    unrelated: 'bg-gray-50 text-gray-500',
  }
  const labels: Record<string, string> = {
    direct: '直接',
    industry: '行业',
    unrelated: '无关',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[relevance || 'unrelated']}`}>
      {labels[relevance || 'unrelated']}
    </span>
  )
}
