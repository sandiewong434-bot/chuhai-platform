import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, MapPin, Calendar, TrendingUp, Globe,
  Factory, Handshake, Rocket, Car, Zap,
} from 'lucide-react'
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

interface EnterpriseInfo {
  id: string
  name: string
  industry: string
  headquarters: string
  founded_year: number
  overseas_countries: number
  flagship_products: string[]
}

interface EnterpriseListData {
  total: number
  items: EnterpriseEvent[]
}

const TYPE_CONFIG: Record<string, { color: string; icon: typeof Factory }> = {
  '投资建厂': { color: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] border-[rgba(96,178,216,0.12)]', icon: Factory },
  '出口/销量': { color: 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)] border-[rgba(96,178,216,0.12)]', icon: TrendingUp },
  '本地化': { color: 'bg-purple-500/10 text-purple-400 border-[rgba(96,178,216,0.12)]', icon: Globe },
  '战略合作': { color: 'bg-amber-500/10 text-amber-400 border-[rgba(96,178,216,0.12)]', icon: Handshake },
  '技术合作': { color: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] border-[rgba(96,178,216,0.12)]', icon: Zap },
  '签约/协议': { color: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)] border-[rgba(96,178,216,0.12)]', icon: Handshake },
  '产品发布': { color: 'bg-purple-500/10 text-purple-400 border-[rgba(96,178,216,0.12)]', icon: Rocket },
  '出海动态': { color: 'bg-white/5 text-[var(--muted-text)] border-[rgba(96,178,216,0.12)]', icon: Car },
}

// 模拟企业信息
const MOCK_ENTERPRISES: EnterpriseInfo[] = [
  { id: 'byd', name: '比亚迪', industry: '新能源汽车', headquarters: '深圳', founded_year: 1995, overseas_countries: 6, flagship_products: ['海豹','元PLUS','海豚'] },
  { id: 'catl', name: '宁德时代', industry: '动力电池', headquarters: '宁德', founded_year: 2011, overseas_countries: 4, flagship_products: ['麒麟电池','神行电池'] },
  { id: 'nio', name: '蔚来', industry: '新能源汽车', headquarters: '合肥', founded_year: 2014, overseas_countries: 5, flagship_products: ['ET5','ES8','EL6'] },
  { id: 'xpeng', name: '小鹏', industry: '新能源汽车', headquarters: '广州', founded_year: 2014, overseas_countries: 3, flagship_products: ['G6','P7i','X9'] },
  { id: 'li', name: '理想', industry: '新能源汽车', headquarters: '北京', founded_year: 2015, overseas_countries: 1, flagship_products: ['L9','L8','L7'] },
  { id: 'zeekr', name: '极氪', industry: '新能源汽车', headquarters: '宁波', founded_year: 2021, overseas_countries: 3, flagship_products: ['001','009','X'] },
  { id: 'mg', name: '上汽MG', industry: '新能源汽车', headquarters: '上海', founded_year: 1924, overseas_countries: 10, flagship_products: ['MG4','ZS','HS'] },
  { id: 'gac', name: '广汽埃安', industry: '新能源汽车', headquarters: '广州', founded_year: 2017, overseas_countries: 2, flagship_products: ['AION Y','AION S','昊铂'] },
]

// 模拟事件数据
const MOCK_EVENTS: EnterpriseEvent[] = [
  { id: 1, enterprise_id: 'byd', enterprise_name: '比亚迪', title: '比亚迪泰国工厂正式投产，年产能15万辆', event_type: '投资建厂', location: '泰国罗勇府', date: '2026-07-15', description: '比亚迪泰国工厂总投资38亿元，占地约96公顷，是比亚迪在东南亚最大的生产基地。', source_name: '泰国工业部', url: '' },
  { id: 2, enterprise_id: 'byd', enterprise_name: '比亚迪', title: '比亚迪巴西生产基地破土动工', event_type: '投资建厂', location: '巴西巴伊亚州', date: '2026-06-20', description: '计划在巴西投资30亿雷亚尔建设生产基地，预计2027年投产。', source_name: '巴西政府', url: '' },
  { id: 3, enterprise_id: 'byd', enterprise_name: '比亚迪', title: '比亚迪匈牙利工厂获准建设', event_type: '投资建厂', location: '匈牙利塞格德', date: '2026-05-10', description: '匈牙利政府批准比亚迪建设欧洲首座乘用车工厂。', source_name: '匈牙利投资促进局', url: '' },
  { id: 4, enterprise_id: 'byd', enterprise_name: '比亚迪', title: '比亚迪海鸥在智利上市，售价约12万人民币', event_type: '产品发布', location: '智利圣地亚哥', date: '2026-08-01', description: '海鸥成为比亚迪在智利市场最畅销车型。', source_name: '智利汽车协会', url: '' },
  { id: 5, enterprise_id: 'catl', enterprise_name: '宁德时代', title: '宁德时代与福特合作密歇根电池厂获批', event_type: '技术合作', location: '美国密歇根', date: '2026-07-28', description: '双方合作的磷酸铁锂电池工厂获得CFIUS批准。', source_name: '路透社', url: '' },
  { id: 6, enterprise_id: 'catl', enterprise_name: '宁德时代', title: '宁德时代匈牙利德布勒森工厂投产', event_type: '投资建厂', location: '匈牙利德布勒森', date: '2026-06-15', description: '欧洲首座电池工厂，规划产能100GWh。', source_name: '匈牙利投资促进局', url: '' },
  { id: 7, enterprise_id: 'catl', enterprise_name: '宁德时代', title: '宁德时代与印尼签署60亿美元投资协议', event_type: '战略合作', location: '印尼雅加达', date: '2026-04-20', description: '涵盖镍矿开采、电池材料到电池制造全产业链。', source_name: '印尼投资部', url: '' },
  { id: 8, enterprise_id: 'nio', enterprise_name: '蔚来', title: '蔚来欧洲第50座换电站投入运营', event_type: '出海动态', location: '挪威奥斯陆', date: '2026-08-10', description: '蔚来在欧洲换电网络持续扩张。', source_name: '蔚来官方', url: '' },
  { id: 9, enterprise_id: 'nio', enterprise_name: '蔚来', title: '蔚来ET5在荷兰交付量突破5000辆', event_type: '出口/销量', location: '荷兰阿姆斯特丹', date: '2026-07-01', description: '蔚来成为荷兰最受欢迎的中国电动车品牌。', source_name: '荷兰汽车进口协会', url: '' },
  { id: 10, enterprise_id: 'nio', enterprise_name: '蔚来', title: '蔚来宣布在中东建立区域总部', event_type: '出海动态', location: '阿联酋迪拜', date: '2026-05-25', description: '中东将成为蔚来全球化战略的重要支点。', source_name: '蔚来官方', url: '' },
  { id: 11, enterprise_id: 'xpeng', enterprise_name: '小鹏', title: '小鹏G6在德国上市，起售价约35万元', event_type: '产品发布', location: '德国慕尼黑', date: '2026-08-05', description: '搭载XNGP智能驾驶系统，对标Model Y。', source_name: '德国汽车周刊', url: '' },
  { id: 12, enterprise_id: 'xpeng', enterprise_name: '小鹏', title: '小鹏与以色列经销商签署独家代理协议', event_type: '签约/协议', location: '以色列特拉维夫', date: '2026-06-01', description: '计划2026年Q4在以色列推出G6和P7i。', source_name: '小鹏官方', url: '' },
  { id: 13, enterprise_id: 'mg', enterprise_name: '上汽MG', title: 'MG4在欧洲月销量突破8000辆', event_type: '出口/销量', location: '欧洲多国', date: '2026-08-12', description: 'MG4成为欧洲最畅销的中国品牌电动车。', source_name: '欧洲汽车制造商协会', url: '' },
  { id: 14, enterprise_id: 'mg', enterprise_name: '上汽MG', title: 'MG在泰国建立右舵车研发中心', event_type: '本地化', location: '泰国曼谷', date: '2026-05-18', description: '研发中心将服务东南亚及澳新市场。', source_name: '上汽集团', url: '' },
  { id: 15, enterprise_id: 'zeekr', enterprise_name: '极氪', title: '极氪009在沙特上市，进军中东高端市场', event_type: '产品发布', location: '沙特利雅得', date: '2026-07-20', description: '极氪009成为首款进入沙特市场的中国高端纯电MPV。', source_name: '极氪官方', url: '' },
  { id: 16, enterprise_id: 'zeekr', enterprise_name: '极氪', title: '极氪欧洲首个体验中心在瑞典斯德哥尔摩开业', event_type: '出海动态', location: '瑞典斯德哥尔摩', date: '2026-04-15', description: '极氪加速北欧市场布局。', source_name: '极氪官方', url: '' },
]

export default function EnterpriseTrack() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<string | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('')

  const { data: enterpriseList } = useQuery({
    queryKey: ['enterprises-list'],
    queryFn: async () => {
      try {
        const res = await enterpriseApi.enterprises()
        return res.data
      } catch {
        return { items: MOCK_ENTERPRISES }
      }
    },
  })

  const { data, isLoading } = useQuery<EnterpriseListData>({
    queryKey: ['enterprise-events', selectedEnterprise],
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = {}
        if (selectedEnterprise) params.enterprise = selectedEnterprise
        const res = await enterpriseApi.list(params)
        return res.data
      } catch {
        // fallback to mock
        let items = MOCK_EVENTS
        if (selectedEnterprise) {
          items = items.filter((e) => e.enterprise_id === selectedEnterprise)
        }
        return { total: items.length, items }
      }
    },
  })

  const enterprises = (enterpriseList?.items as EnterpriseInfo[]) || MOCK_ENTERPRISES
  const events = data?.items || MOCK_EVENTS

  const filteredEvents = eventTypeFilter
    ? events.filter((e) => e.event_type === eventTypeFilter)
    : events

  // 按企业分组事件
  const groupedEvents: Record<string, EnterpriseEvent[]> = {}
  filteredEvents.forEach((event) => {
    if (!groupedEvents[event.enterprise_name]) {
      groupedEvents[event.enterprise_name] = []
    }
    groupedEvents[event.enterprise_name].push(event)
  })

  // 按日期排序
  Object.keys(groupedEvents).forEach((key) => {
    groupedEvents[key].sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  })

  const eventTypes = Array.from(new Set(MOCK_EVENTS.map((e) => e.event_type)))

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] uppercase tracking-wider">Enterprise Tracking</span>
        </div>
        <h2 className="text-2xl font-bold text-white">企业出海追踪</h2>
        <p className="text-[var(--muted-text)] mt-1">出海动态 · 投资建厂 · 战略合作 · 时间线</p>
      </div>

      {/* 企业筛选 + 统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 企业选择 */}
        <div className="lg:col-span-2 ch-card-cut">
          <div className="ch-card-cut-inner p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="ch-title-bar" />
              <h3 className="text-sm font-medium text-[var(--muted-text)]">选择企业</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedEnterprise(null)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedEnterprise === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-[var(--muted-text)] hover:bg-white/10'
                }`}
              >
                全部
              </button>
              {enterprises.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEnterprise(e.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedEnterprise === e.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-[var(--muted-text)] hover:bg-white/10'
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="space-y-3">
          <div className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3">
              <div className="flex items-center gap-2">
                <span className="ch-dot" />
                <span className="text-xs text-[var(--muted-text)]">追踪企业</span>
              </div>
              <p className="text-xl font-bold text-white ch-glow-num mt-1">{enterprises.length}</p>
            </div>
          </div>
          <div className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3">
              <div className="flex items-center gap-2">
                <span className="ch-dot ch-dot-teal" />
                <span className="text-xs text-[var(--muted-text)]">动态事件</span>
              </div>
              <p className="text-xl font-bold text-white ch-glow-num mt-1">{events.length}</p>
            </div>
          </div>
          <div className="ch-card-cut-sm">
            <div className="ch-card-cut-sm-inner p-3">
              <div className="flex items-center gap-2">
                <span className="ch-dot ch-dot-amber" />
                <span className="text-xs text-[var(--muted-text)]">覆盖国家</span>
              </div>
              <p className="text-xl font-bold text-white ch-glow-num mt-1">
                {new Set(events.map((e) => e.location?.split(/[，,]/)[0] ?? '未知')).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 事件类型筛选 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setEventTypeFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            eventTypeFilter === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-[#0a1a2b] text-[var(--muted-text)] border-[rgba(96,178,216,0.12)] hover:border-[rgba(96,178,216,0.25)]'
          }`}
        >
          全部类型
        </button>
        {eventTypes.map((type) => {
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG['出海动态']
          const count = events.filter((e) => e.event_type === type).length
          return (
            <button
              key={type}
              onClick={() => setEventTypeFilter(eventTypeFilter === type ? '' : type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                eventTypeFilter === type ? cfg.color : 'bg-[#0a1a2b] text-[var(--muted-text)] border-[rgba(96,178,216,0.12)] hover:border-[rgba(96,178,216,0.25)]'
              }`}
            >
              <cfg.icon className="w-3 h-3" />
              {type}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* 企业信息卡（选中时） */}
      {selectedEnterprise && (
        <div className="ch-card-cut">
          <div className="ch-card-cut-inner p-5">
            {(() => {
              const ent = enterprises.find((e) => e.id === selectedEnterprise)
              if (!ent) return null
              return (
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-[var(--cyan)]" />
                    <div>
                      <h3 className="font-bold text-white">{ent.name}</h3>
                      <p className="text-xs text-[var(--muted-text)]">{ent.industry} · 成立于{ent.founded_year}年</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
                    <MapPin className="w-4 h-4" />
                    总部：{ent.headquarters}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
                    <Globe className="w-4 h-4" />
                    出海国家：{ent.overseas_countries}个
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-text)]">
                    <Car className="w-4 h-4" />
                    主力产品：{ent.flagship_products?.join(' / ') || '未知'}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* 时间线 */}
      {isLoading ? (
        <div className="text-center py-12 text-[var(--muted-text)]">加载中...</div>
      ) : Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-text)]">暂无数据</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([enterpriseName, entEvents]) => (
            <div key={enterpriseName} className="ch-card-cut">
              <div className="ch-card-cut-inner p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="ch-title-bar" />
                  <Building2 className="w-5 h-5 text-[var(--cyan)]" />
                  <h3 className="text-lg font-semibold text-white">
                    {enterpriseName} 出海时间线
                  </h3>
                  <span className="text-sm text-[var(--muted-text)]">({entEvents.length}条动态)</span>
                </div>

                <div className="relative">
                  {/* 时间线竖线 */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-[rgba(96,178,216,0.12)]" />

                  <div className="space-y-6">
                    {entEvents.map((event, index) => {
                      const cfg = TYPE_CONFIG[event.event_type] || TYPE_CONFIG['出海动态']
                      const Icon = cfg.icon
                      return (
                        <div key={index} className="relative pl-10">
                          {/* 时间点 */}
                          <div className={`absolute left-2 top-1.5 w-5 h-5 rounded-full bg-[#0a1a2b] border-2 flex items-center justify-center`}
                            style={{ borderColor: event.event_type === '投资建厂' ? '#00c2ff' : event.event_type === '出口/销量' ? '#3ce6b4' : '#a855f7' }}
                          >
                            <Icon className="w-2.5 h-2.5" style={{ color: event.event_type === '投资建厂' ? '#00c2ff' : event.event_type === '出口/销量' ? '#3ce6b4' : '#a855f7' }} />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <div className="flex items-center gap-2 text-sm text-[var(--muted-text)] min-w-[110px]">
                              <Calendar className="w-3.5 h-3.5" />
                              {event.date || '日期未知'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
                                  {event.event_type}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-[var(--muted-text)]">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-white">{event.title}</p>
                              <p className="text-xs text-[var(--muted-text)] mt-1">{event.description}</p>
                              <p className="text-xs text-[var(--muted-text)] mt-1">来源：{event.source_name}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ch-card-cut">
        <div className="ch-card-cut-inner p-4 text-xs text-[var(--muted-text)]">
          数据来源：企业公告、商务部对外投资备案、各国投资促进机构、行业协会。更新频率：每日。
        </div>
      </div>
    </div>
  )
}
