import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, BookOpen,
  Calendar, Tag, Database, TrendingUp, FileText,
} from 'lucide-react'
import { articleApi } from '@/lib/api'

interface Article {
  id: number
  title: string
  source_name: string
  publish_date: string | null
  category_layer: string | null
  relevance: string | null
  category_tag: string | null
  summary: string | null
}

interface ArticleListData {
  total: number
  items: Article[]
}

// 模拟文章数据
const MOCK_ARTICLES: Article[] = [
  { id: 1, title: '比亚迪泰国工厂正式投产，年产能15万辆', source_name: '巨潮资讯网', publish_date: '2026-08-28', category_layer: 'enterprise', relevance: 'direct', category_tag: '投资建厂,泰国', summary: '比亚迪泰国工厂总投资38亿元，占地约96公顷，是比亚迪在东南亚最大的生产基地，预计创造约1万个就业岗位。' },
  { id: 2, title: '欧盟对中国电动车加征临时反补贴税，税率最高达38%', source_name: '欧盟EUR-Lex', publish_date: '2026-08-27', category_layer: 'nation', relevance: 'direct', category_tag: '关税,欧盟,贸易壁垒', summary: '欧盟委员会宣布对进口自中国的电动汽车征收临时反补贴税，比亚迪17.4%、吉利19.9%、上汽38%。' },
  { id: 3, title: '宁德时代与印尼签署60亿美元电池产业链投资协议', source_name: '商务部对外投资', publish_date: '2026-08-26', category_layer: 'enterprise', relevance: 'direct', category_tag: '战略合作,印尼,电池', summary: '宁德时代将在印尼建设从镍矿开采、冶炼到电池材料的全产业链基地。' },
  { id: 4, title: '蔚来欧洲第50座换电站投入运营', source_name: '蔚来官方', publish_date: '2026-08-25', category_layer: 'enterprise', relevance: 'direct', category_tag: '出海动态,挪威,换电站', summary: '蔚来在欧洲换电网络持续扩张，挪威、德国、荷兰为主要市场。' },
  { id: 5, title: '美国对华301关税复审，电动汽车关税或维持25%', source_name: '美国USTR', publish_date: '2026-08-24', category_layer: 'nation', relevance: 'direct', category_tag: '关税,美国,301', summary: 'USTR发布301关税复审结果，建议维持对中国电动汽车的25%关税。' },
  { id: 6, title: '土耳其对华电动车加征40%附加关税', source_name: '中国贸易救济信息网', publish_date: '2026-08-23', category_layer: 'nation', relevance: 'direct', category_tag: '关税,土耳其,贸易壁垒', summary: '土耳其贸易部宣布对进口自中国的电动汽车加征40%附加关税。' },
  { id: 7, title: '小鹏G6在德国上市，起售价约35万人民币', source_name: '德国汽车周刊', publish_date: '2026-08-22', category_layer: 'enterprise', relevance: 'direct', category_tag: '产品发布,德国,小鹏', summary: '小鹏G6搭载XNGP智能驾驶系统，在德国市场对标特斯拉Model Y。' },
  { id: 8, title: '2026年7月中国新能源汽车出口同比增长45%', source_name: '中国汽车工业协会', publish_date: '2026-08-21', category_layer: 'industry', relevance: 'industry', category_tag: '出口数据,行业', summary: '7月新能源汽车出口18.5万辆，其中纯电动车占比82%，插混占比18%。' },
  { id: 9, title: 'MG4在欧洲月销量突破8000辆，成最畅销中国品牌', source_name: '欧洲汽车制造商协会', publish_date: '2026-08-20', category_layer: 'enterprise', relevance: 'direct', category_tag: '出口/销量,欧洲,MG', summary: 'MG4连续3个月成为欧洲最畅销的中国品牌电动汽车。' },
  { id: 10, title: '极氪009在沙特上市，进军中东高端市场', source_name: '极氪官方', publish_date: '2026-08-19', category_layer: 'enterprise', relevance: 'direct', category_tag: '产品发布,沙特,极氪', summary: '极氪009成为首款进入沙特市场的中国高端纯电MPV，售价约45万元。' },
  { id: 11, title: '巴西结束电动车进口免税政策', source_name: '巴西Anfavea', publish_date: '2026-08-18', category_layer: 'nation', relevance: 'direct', category_tag: '政策,巴西,关税', summary: '巴西政府宣布结束电动汽车进口免税政策，将征收18%的进口关税。' },
  { id: 12, title: '匈牙利投资促进局：中国车企投资带动供应链本地化', source_name: '匈牙利HIPA', publish_date: '2026-08-17', category_layer: 'industry', relevance: 'industry', category_tag: '本地化,匈牙利,供应链', summary: '中国车企在匈牙利的投资已带动超过50家配套企业入驻。' },
  { id: 13, title: '理想汽车宣布2027年进入欧洲市场', source_name: '理想官方', publish_date: '2026-08-16', category_layer: 'enterprise', relevance: 'direct', category_tag: '出海动态,欧洲,理想', summary: '理想汽车计划2027年在德国、荷兰、挪威推出L系列车型。' },
  { id: 14, title: '2026年上半年中国动力电池出口量增长60%', source_name: '高工锂电', publish_date: '2026-08-15', category_layer: 'industry', relevance: 'industry', category_tag: '出口数据,电池,行业', summary: '上半年动力电池出口达45GWh，宁德时代、比亚迪、中创新航位列前三。' },
  { id: 15, title: '印度放宽电动汽车进口关税，中国企业或受益', source_name: '路透社', publish_date: '2026-08-14', category_layer: 'nation', relevance: 'industry', category_tag: '政策,印度,关税', summary: '印度政府拟将电动汽车进口关税从60%降至35%，吸引外资建厂。' },
  { id: 16, title: '广汽埃安泰国工厂奠基，规划年产能5万辆', source_name: '广汽集团', publish_date: '2026-08-13', category_layer: 'enterprise', relevance: 'direct', category_tag: '投资建厂,泰国,埃安', summary: '广汽埃安泰国工厂总投资15亿元，预计2027年投产。' },
  { id: 17, title: '全球新能源汽车渗透率突破25%', source_name: 'S&P Global', publish_date: '2026-08-12', category_layer: 'industry', relevance: 'industry', category_tag: '市场数据,全球', summary: '2026年Q2全球新能源汽车销量达380万辆，渗透率25.3%。' },
  { id: 18, title: '比亚迪海豹在澳大利亚获得五星安全评级', source_name: 'ANCAP', publish_date: '2026-08-11', category_layer: 'enterprise', relevance: 'direct', category_tag: '产品,澳大利亚,安全', summary: '比亚迪海豹在澳大利亚新车安全评鉴中获得五星评级。' },
  { id: 19, title: '中国-东盟新能源汽车合作论坛在南宁举办', source_name: '商务部', publish_date: '2026-08-10', category_layer: 'nation', relevance: 'industry', category_tag: '会议,东盟,合作', summary: '论坛签署多项合作协议，涉及技术转让、标准互认等。' },
  { id: 20, title: '蔚来ET5在荷兰交付量突破5000辆', source_name: '荷兰汽车进口协会', publish_date: '2026-08-09', category_layer: 'enterprise', relevance: 'direct', category_tag: '出口/销量,荷兰,蔚来', summary: '蔚来成为荷兰最受欢迎的中国电动车品牌，ET5为销量主力。' },
]

const SOURCE_OPTIONS = ['全部', '巨潮资讯网', '商务部对外投资', '欧盟EUR-Lex', '美国USTR', '蔚来官方', '极氪官方', '路透社', '中国汽车工业协会', '高工锂电']

export default function ArticleList() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [layer, setLayer] = useState('')
  const [relevance, setRelevance] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const size = 10

  const { data, isLoading } = useQuery<ArticleListData>({
    queryKey: ['articles', page, q, layer, relevance, sourceFilter],
    queryFn: async () => {
      try {
        const res = await articleApi.list({
          page,
          size,
          q: q || undefined,
          layer: layer || undefined,
          relevance: relevance || undefined,
        })
        return res.data
      } catch {
        // fallback to mock with client-side filtering
        let items = MOCK_ARTICLES
        if (q) items = items.filter((a) => a.title.includes(q) || (a.summary && a.summary.includes(q)))
        if (layer) items = items.filter((a) => a.category_layer === layer)
        if (relevance) items = items.filter((a) => a.relevance === relevance)
        if (sourceFilter && sourceFilter !== '全部') items = items.filter((a) => a.source_name === sourceFilter)
        const start = (page - 1) * size
        return { total: items.length, items: items.slice(start, start + size) }
      }
    },
  })

  const totalPages = data ? Math.ceil(data.total / size) : 0
  const articles = data?.items || []

  // 统计
  const totalArticles = data?.total || MOCK_ARTICLES.length
  const directCount = MOCK_ARTICLES.filter((a) => a.relevance === 'direct').length
  const industryCount = MOCK_ARTICLES.filter((a) => a.relevance === 'industry').length
  const todayCount = MOCK_ARTICLES.filter((a) => a.publish_date === '2026-08-28').length

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">文章检索</h2>
        <p className="text-gray-500 mt-1">出海动态 · 行业资讯 · 政策法规 · 全文检索</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">文章总数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalArticles}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">直接相关</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{directCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">行业相关</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{industryCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">今日更新</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{todayCount}</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索标题、正文或标签..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => { setQ(''); setLayer(''); setRelevance(''); setSourceFilter(''); setPage(1) }}
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

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s === '全部' ? '' : s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>暂无数据</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {articles.map((article) => (
                <div key={article.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/articles/${article.id}`}
                        className="text-sm font-medium text-blue-700 hover:underline line-clamp-1"
                      >
                        {article.title}
                      </Link>
                      {article.summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.publish_date || '-'}
                        </span>
                        <span className="text-xs text-gray-400">来源：{article.source_name}</span>
                        <LayerBadge layer={article.category_layer} />
                        <RelevanceBadge relevance={article.relevance} />
                        {article.category_tag && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {article.category_tag.split(/[,，]/).slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  共 {data?.total || 0} 条，第 {page}/{totalPages} 页
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
            )}
          </>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
        数据来源：L1出海动态库 + L2行业资讯库 + L5政策法规库 + L9贸易壁垒库。每日自动采集更新。
      </div>
    </div>
  )
}

function LayerBadge({ layer }: { layer: string | null }) {
  const styles: Record<string, string> = {
    enterprise: 'bg-blue-50 text-blue-700 border-blue-200',
    industry: 'bg-green-50 text-green-700 border-green-200',
    nation: 'bg-purple-50 text-purple-700 border-purple-200',
    none: 'bg-gray-50 text-gray-600 border-gray-200',
  }
  const labels: Record<string, string> = {
    enterprise: '企业',
    industry: '行业',
    nation: '国家',
    none: '无',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[layer || 'none']}`}>
      {labels[layer || 'none']}
    </span>
  )
}

function RelevanceBadge({ relevance }: { relevance: string | null }) {
  const styles: Record<string, string> = {
    direct: 'bg-red-50 text-red-700 border-red-200',
    industry: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    unrelated: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    direct: '直接',
    industry: '行业',
    unrelated: '无关',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[relevance || 'unrelated']}`}>
      {labels[relevance || 'unrelated']}
    </span>
  )
}
