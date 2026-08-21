import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import { articleApi } from '@/lib/api'

interface ArticleDetail {
  id: number
  title: string
  content: string | null
  source_name: string
  url: string
  publish_date: string | null
  crawled_at: string
  category_layer: string | null
  category_tag: string | null
  relevance: string | null
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const articleId = Number(id)

  const { data, isLoading } = useQuery<ArticleDetail>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const res = await articleApi.get(articleId)
      return res.data
    },
    enabled: !isNaN(articleId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">文章不存在</p>
        <Link to="/articles" className="text-blue-600 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link
        to="/articles"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回列表
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {data.publish_date || data.crawled_at.split('T')[0]}
          </span>
          <span>来源：{data.source_name}</span>
          {data.category_layer && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
              {data.category_layer}
            </span>
          )}
          {data.relevance && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
              {data.relevance}
            </span>
          )}
        </div>

        {data.category_tag && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.category_tag.split(/[,，]/).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6">
          {data.content ? (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {data.content}
            </div>
          ) : (
            <p className="text-gray-400 italic">暂无正文内容</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            查看原文
          </a>
        </div>
      </article>
    </div>
  )
}
