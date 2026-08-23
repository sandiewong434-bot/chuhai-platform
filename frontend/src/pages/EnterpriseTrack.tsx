import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Calendar } from 'lucide-react'
import { enterpriseApi } from '@/lib/api'

interface EnterpriseEvent {
  id: number
  enterprise_id: string
  enterprise_name: string
  title: string
  event_type: string
  location: string
  date: string | null
  description: string
  source_name: string
  url: string
}

interface EnterpriseListData {
  total: number
  items: EnterpriseEvent[]
}

const TYPE_COLORS: Record<string, string> = {
  '投资建厂': 'bg-blue-50 text-blue-700',
  '出口/销量': 'bg-green-50 text-green-700',
  '本地化': 'bg-purple-50 text-purple-700',
  '战略合作': 'bg-orange-50 text-orange-700',
  '技术合作': 'bg-cyan-50 text-cyan-700',
  '签约/协议': 'bg-pink-50 text-pink-700',
  '产品发布': 'bg-indigo-50 text-indigo-700',
  '出海动态': 'bg-gray-50 text-gray-700',
}

export default function EnterpriseTrack() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(null)

  const { data: enterpriseList } = useQuery({
    queryKey: ['enterprises-list'],
    queryFn: async () => {
      const res = await enterpriseApi.enterprises()
      return res.data
    },
  })

  const { data, isLoading } = useQuery<EnterpriseListData>({
    queryKey: ['enterprise-events', selectedEnterprise],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (selectedEnterprise) params.enterprise = selectedEnterprise
      const res = await enterpriseApi.list(params)
      return res.data
    },
  })

  const enterprises = enterpriseList?.items || []
  const events = data?.items || []

  // 按企业分组事件
  const groupedEvents: Record<string, EnterpriseEvent[]> = {}
  events.forEach((event) => {
    if (!groupedEvents[event.enterprise_name]) {
      groupedEvents[event.enterprise_name] = []
    }
    groupedEvents[event.enterprise_name].push(event)
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">企业追踪</h2>
        <p className="text-gray-500 mt-1">出海动态与投资建厂时间线</p>
      </div>

      {/* 企业选择 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedEnterprise(null)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedEnterprise === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {enterprises.map((e: { id: string; name: string }) => (
            <button
              key={e.id}
              onClick={() => setSelectedEnterprise(e.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedEnterprise === e.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>

      {/* 时间线 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        Object.entries(groupedEvents).map(([enterpriseName, entEvents]) => (
          <div key={enterpriseName} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {enterpriseName} 出海动态
              </h3>
            </div>

            <div className="relative">
              {/* 时间线竖线 */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

              <div className="space-y-6">
                {entEvents.map((event, index) => (
                  <div key={index} className="relative pl-10">
                    {/* 时间点 */}
                    <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-blue-500" />

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[100px]">
                        <Calendar className="w-4 h-4" />
                        {event.date || '日期未知'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                            {event.event_type}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{event.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
