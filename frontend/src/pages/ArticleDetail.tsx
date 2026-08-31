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
        <div className="text-[var(--muted-text)]">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-text)]">文章不存在</p>
        <Link to="/articles" className="text-[var(--cyan)] hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Back button with hover glow */}
      <Link
        to="/articles"
        className="inline-flex items-center text-sm text-[var(--muted-text)] hover:text-white hover:shadow-[0_0_12px_rgba(0,194,255,0.25)] px-3 py-1.5 rounded-md transition-all"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回列表
      </Link>

      {/* Article card with cut-corner */}
      <div className="ch-card-cut">
        <article className="ch-card-cut-inner p-6 lg:p-8">
          {/* Title with gradient bar decoration */}
          <div className="flex items-start gap-3">
            <div className="ch-title-bar mt-3" />
            <h1 className="text-2xl font-bold text-white">{data.title}</h1>
          </div>

          {/* Meta info with glowing badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--muted-text)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {data.publish_date || (data.crawled_at ? data.crawled_at.split('T')[0] : '日期未知')}
            </span>
            <span>来源：{data.source_name}</span>
            {data.category_layer && (
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs shadow-[0_0_6px_rgba(0,194,255,0.15)] border border-[rgba(96,178,216,0.15)]">
                {data.category_layer}
              </span>
            )}
            {data.relevance && (
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs shadow-[0_0_6px_rgba(0,194,255,0.15)] border border-[rgba(96,178,216,0.15)]">
                {data.relevance}
              </span>
            )}
          </div>

          {/* Tags with glow */}
          {data.category_tag && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.category_tag.split(/[,，]/).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] rounded text-xs border border-[rgba(0,194,255,0.15)] shadow-[0_0_6px_rgba(0,194,255,0.15)]"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-[rgba(96,178,216,0.12)] pt-6">
            {data.content ? (
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                {data.content}
              </div>
            ) : (
              <p className="text-[var(--muted-text)] italic">暂无正文内容</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(96,178,216,0.12)]">
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-[var(--cyan)] hover:underline hover:shadow-[0_0_12px_rgba(0,194,255,0.25)] px-3 py-1.5 rounded-md transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              查看原文
            </a>
          </div>
        </article>
      </div>
    </div>
  )
}
