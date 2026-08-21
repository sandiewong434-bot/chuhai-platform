import { useState } from 'react'
import { Building2, MapPin, Calendar, TrendingUp } from 'lucide-react'

// 演示数据
const DEMO_ENTERPRISES = [
  {
    id: 1,
    name: '比亚迪',
    events: [
      { date: '2024-01-15', type: '投资建厂', location: '泰国罗勇府', detail: '宣布投资38亿元建设年产15万辆的整车工厂' },
      { date: '2024-03-20', type: '产品发布', location: '印度尼西亚', detail: '海豹、海豚等车型正式进入印尼市场' },
      { date: '2024-05-10', type: '本地化', location: '巴西', detail: '巴伊亚州工厂正式投产，年产能15万辆' },
      { date: '2024-07-08', type: '战略合作', location: '匈牙利', detail: '与当地政府签署建厂意向协议' },
    ],
  },
  {
    id: 2,
    name: '宁德时代',
    events: [
      { date: '2023-12-01', type: '投资建厂', location: '匈牙利德布勒森', detail: '投资73.4亿欧元建设100GWh电池工厂' },
      { date: '2024-02-18', type: '技术合作', location: '泰国', detail: '与泰国PTT集团成立合资公司建设电池工厂' },
      { date: '2024-04-22', type: '产能扩张', location: '德国图林根', detail: '德国工厂产能提升至14GWh' },
      { date: '2024-06-15', type: '投资建厂', location: '西班牙', detail: '宣布与Stellantis合资在西班牙建厂' },
    ],
  },
  {
    id: 3,
    name: '蔚来汽车',
    events: [
      { date: '2024-01-10', type: '市场进入', location: '阿联酋', detail: '正式进入阿联酋市场，与当地经销商合作' },
      { date: '2024-03-05', type: '换电站', location: '欧洲', detail: '欧洲换电站数量突破50座' },
      { date: '2024-05-20', type: '战略合作', location: '匈牙利', detail: '与匈牙利政府就建厂进行谈判' },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  '投资建厂': 'bg-blue-50 text-blue-700',
  '产品发布': 'bg-green-50 text-green-700',
  '本地化': 'bg-purple-50 text-purple-700',
  '战略合作': 'bg-orange-50 text-orange-700',
  '技术合作': 'bg-cyan-50 text-cyan-700',
  '产能扩张': 'bg-pink-50 text-pink-700',
  '市场进入': 'bg-indigo-50 text-indigo-700',
  '换电站': 'bg-teal-50 text-teal-700',
}

export default function EnterpriseTrack() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<number | null>(1)

  const enterprise = DEMO_ENTERPRISES.find((e) => e.id === selectedEnterprise)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">企业追踪</h2>
        <p className="text-gray-500 mt-1">出海动态与投资建厂时间线</p>
      </div>

      {/* 企业选择 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2 flex-wrap">
          {DEMO_ENTERPRISES.map((e) => (
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
      {enterprise && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {enterprise.name} 出海动态
            </h3>
          </div>

          <div className="relative">
            {/* 时间线竖线 */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-6">
              {enterprise.events.map((event, index) => (
                <div key={index} className="relative pl-10">
                  {/* 时间点 */}
                  <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-blue-500" />

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[100px]">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[event.type] || 'bg-gray-100 text-gray-600'}`}>
                          {event.type}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{event.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
