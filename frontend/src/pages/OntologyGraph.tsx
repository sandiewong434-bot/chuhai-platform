import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Network, Database, Globe, Factory, Box,
  TrendingUp, Users, Link2,
} from 'lucide-react'
import { ontologyApi } from '@/lib/api'
import ForceGraph from '@/components/ForceGraph'

interface ObjectEntity {
  obj_id: string
  obj_type: string
  name: string
  source_libraries: string | null
  attributes_json?: Record<string, unknown>
}

interface GraphData {
  center: string
  nodes: { id: string; type: string }[]
  edges: { source: string; target: string; type: string; confidence: string | null }[]
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: typeof Factory; label: string }> = {
  enterprise:    { color: '#00c2ff', bg: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)]', icon: Factory, label: '企业' },
  country_region:{ color: '#3ce6b4', bg: 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)]', icon: Globe, label: '目的国' },
  product_item:  { color: '#a855f7', bg: 'bg-purple-500/10 text-purple-400', icon: Box, label: '产品' },
  industrial_chain_segment: { color: '#facc15', bg: 'bg-yellow-500/10 text-yellow-400', icon: Link2, label: '产业链环节' },
  port_logistics:{ color: '#f472b6', bg: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)]', icon: TrendingUp, label: '港口/物流' },
}

const MOCK_OBJECTS: ObjectEntity[] = [
  { obj_id: 'e1', obj_type: 'enterprise', name: '比亚迪', source_libraries: 'L1,L5' },
  { obj_id: 'e2', obj_type: 'enterprise', name: '宁德时代', source_libraries: 'L1,L3' },
  { obj_id: 'e3', obj_type: 'enterprise', name: '蔚来', source_libraries: 'L1,L5' },
]

const MOCK_GRAPHS: Record<string, GraphData> = {
  '比亚迪': {
    center: '比亚迪',
    nodes: [
      { id: '比亚迪', type: 'enterprise' },
      { id: '泰国', type: 'country_region' },
      { id: '巴西', type: 'country_region' },
      { id: '匈牙利', type: 'country_region' },
    ],
    edges: [
      { source: '比亚迪', target: '泰国', type: '海外投资', confidence: '高' },
      { source: '比亚迪', target: '巴西', type: '海外投资', confidence: '高' },
      { source: '比亚迪', target: '匈牙利', type: '海外投资', confidence: '高' },
    ],
  },
}

const REL_TYPES = ['全部', '海外投资', '海外经营', '贸易壁垒']

// 从 attributes_json 中提取可展示的字段
function getAttrDisplay(obj: ObjectEntity | undefined): { label: string; value: string }[] {
  if (!obj?.attributes_json) return []
  const attrs = obj.attributes_json
  const result: { label: string; value: string }[] = []
  const fieldMap: Record<string, string> = {
    '企业类型': '企业类型',
    '产业': '产业',
    '环节': '环节',
    '城市': '城市',
    '省份': '省份',
    '上市代码': '上市代码',
    '营收亿元': '营收(亿元)',
    '市值亿元': '市值(亿元)',
    '官网': '官网',
  }
  for (const [key, label] of Object.entries(fieldMap)) {
    const val = attrs[key]
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        result.push({ label, value: val.join(', ') })
      } else {
        result.push({ label, value: String(val) })
      }
    }
  }
  return result
}

export default function OntologyGraph() {
  const [q, setQ] = useState('')
  const [selectedObj, setSelectedObj] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [relTypeFilter, setRelTypeFilter] = useState<string>('')
  const [showDetail, setShowDetail] = useState(false)

  const { data: objectsData } = useQuery<{ items?: ObjectEntity[] }>({
    queryKey: ['objects', q],
    queryFn: async () => {
      try {
        const res = await ontologyApi.objects({ q: q || undefined, size: 50 })
        return res.data
      } catch {
        return { items: MOCK_OBJECTS }
      }
    },
  })

  const { data: graph } = useQuery<GraphData>({
    queryKey: ['graph', selectedObj],
    queryFn: async () => {
      if (!selectedObj) return { center: '', nodes: [], edges: [] }
      try {
        const res = await ontologyApi.graph(selectedObj, 1)
        return res.data
      } catch {
        return MOCK_GRAPHS[selectedObj] || { center: selectedObj, nodes: [{ id: selectedObj, type: 'enterprise' }], edges: [] }
      }
    },
    enabled: !!selectedObj,
  })

  // 查询选中对象的详情
  const { data: objDetail } = useQuery<ObjectEntity>({
    queryKey: ['objectDetail', selectedObj],
    queryFn: async () => {
      if (!selectedObj) return null as unknown as ObjectEntity
      try {
        const listRes = await ontologyApi.objects({ q: selectedObj, size: 1 })
        const items = listRes.data.items || []
        if (items.length === 0) return null as unknown as ObjectEntity
        const detailRes = await ontologyApi.object(items[0].obj_id)
        return detailRes.data
      } catch {
        return null as unknown as ObjectEntity
      }
    },
    enabled: !!selectedObj,
  })

  const objects = objectsData?.items || MOCK_OBJECTS

  const filteredObjects = typeFilter
    ? objects.filter((o) => o.obj_type === typeFilter)
    : objects

  const searchedObjects = q
    ? filteredObjects.filter((o) => o.name.includes(q))
    : filteredObjects

  const filteredEdges = relTypeFilter
    ? (graph?.edges || []).filter((e) => e.type === relTypeFilter)
    : (graph?.edges || [])

  const typeStats = objects.reduce((acc, obj) => {
    acc[obj.obj_type] = (acc[obj.obj_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const selectedObjData = objects.find((o) => o.name === selectedObj)
  const attrDisplay = getAttrDisplay(objDetail || selectedObjData)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="ch-title-bar" />
          <span className="text-xs font-medium text-[var(--cyan)] uppercase tracking-wider">Ontology Graph</span>
        </div>
        <h2 className="text-2xl font-bold text-white">本体图谱</h2>
        <p className="text-[var(--muted-text)] mt-1">企业 · 目的国 · 产品 · 产业链 · 关系网络</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(typeStats).map(([type, count]) => {
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG['enterprise']
          const Icon = cfg.icon
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={`ch-card-cut-sm text-left transition-all ${
                typeFilter === type ? 'ring-2 ring-[rgba(0,194,255,0.2)]' : ''
              }`}
            >
              <div className="ch-card-cut-sm-inner p-3">
                <div className="flex items-center gap-2">
                  <span className="ch-dot" style={{ backgroundColor: cfg.color }} />
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  <span className="text-xs text-[var(--muted-text)]">{cfg.label}</span>
                </div>
                <p className="text-xl font-bold text-white ch-glow-num mt-1">{count}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 对象列表 */}
        <div className="ch-card-cut overflow-hidden">
          <div className="ch-card-cut-inner">
            <div className="px-4 py-3 border-b border-[rgba(96,178,216,0.12)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-text)]" />
                <input
                  type="text"
                  placeholder="搜索企业/国家/产品..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[rgba(96,178,216,0.15)] rounded-md text-sm bg-[#0a1a2b] text-white placeholder:text-[var(--muted-text)]"
                />
              </div>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {searchedObjects.length === 0 ? (
                <div className="p-4 text-center text-[var(--muted-text)] text-sm">无匹配结果</div>
              ) : (
                searchedObjects.map((obj) => (
                  <button
                    key={obj.obj_id}
                    onClick={() => { setSelectedObj(obj.name); setShowDetail(true) }}
                    className={`w-full text-left px-4 py-2.5 border-b border-[rgba(96,178,216,0.08)] hover:bg-white/5 transition-colors ${
                      selectedObj === obj.name ? 'bg-[rgba(0,194,255,0.08)]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{obj.name}</span>
                      <TypeBadge type={obj.obj_type} />
                    </div>
                    {obj.source_libraries && (
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">
                        来源库: {obj.source_libraries}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 关系图谱 + 详情 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 对象详情面板 */}
          {showDetail && selectedObj && attrDisplay.length > 0 && (
            <div className="ch-card-cut">
              <div className="ch-card-cut-inner p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="ch-title-bar" />
                    <h3 className="font-medium text-white">{selectedObj} 详情</h3>
                    {selectedObjData && <TypeBadge type={selectedObjData.obj_type} />}
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="text-xs text-[var(--muted-text)] hover:text-white"
                  >
                    收起
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {attrDisplay.map((attr) => (
                    <div key={attr.label} className="bg-white/5 rounded-lg p-2.5">
                      <p className="text-xs text-[var(--muted-text)]">{attr.label}</p>
                      <p className="text-sm font-medium text-white mt-0.5 truncate">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 关系图谱 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="ch-title-bar" />
                  <Network className="w-5 h-5 text-[var(--muted-text)]" />
                  <h3 className="font-medium text-white">
                    {selectedObj ? `${selectedObj} 的关系网络` : '请选择对象查看关系图谱'}
                  </h3>
                </div>
                {graph && graph.nodes.length > 0 && (
                  <div className="flex gap-3">
                    {Array.from(new Set(graph.nodes.map((n) => n.type))).map((t) => {
                      const cfg = TYPE_CONFIG[t]
                      if (!cfg) return null
                      return (
                        <div key={t} className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span className="text-xs text-[var(--muted-text)]">{cfg.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {graph && graph.nodes.length > 0 ? (
                <div className="space-y-4">
                  {/* 力导向图 */}
                  <div className="ch-card-cut">
                    <div className="ch-card-cut-inner overflow-hidden bg-white/5">
                      <ForceGraph
                        nodes={graph.nodes}
                        edges={filteredEdges}
                        width={700}
                        height={350}
                        centerNode={graph.center}
                        onNodeClick={(nodeId) => setSelectedObj(nodeId)}
                      />
                    </div>
                  </div>

                  {/* 关系列表明细 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-[var(--muted-text)] flex items-center gap-2">
                        <div className="ch-title-bar" />
                        <Link2 className="w-3.5 h-3.5" />
                        关系明细 ({filteredEdges.length}条)
                      </h4>
                      {/* 关系类型筛选 */}
                      <div className="flex gap-1.5">
                        {REL_TYPES.map((rt) => (
                          <button
                            key={rt}
                            onClick={() => setRelTypeFilter(rt === '全部' ? '' : rt)}
                            className={`px-2 py-0.5 rounded text-xs transition-colors ${
                              (rt === '全部' && !relTypeFilter) || relTypeFilter === rt
                                ? 'bg-[rgba(0,194,255,0.15)] text-[var(--cyan)] border border-[rgba(0,194,255,0.3)]'
                                : 'bg-white/5 text-[var(--muted-text)] hover:bg-white/10'
                            }`}
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {filteredEdges.map((edge, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm px-3 py-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
                        >
                          <span className="font-medium text-white">{edge.source}</span>
                          <span className="text-[var(--muted-text)]">→</span>
                          <span className="px-2 py-0.5 bg-[rgba(0,194,255,0.08)] text-[var(--cyan)] rounded text-xs border border-[rgba(96,178,216,0.12)]">
                            {edge.type}
                          </span>
                          <span className="text-[var(--muted-text)]">→</span>
                          <span className="font-medium text-white">{edge.target}</span>
                          {edge.confidence && (
                            <span className="ml-auto text-xs text-[var(--muted-text)]">
                              置信度: {edge.confidence}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedObj ? (
                <div className="text-center py-12 text-[var(--muted-text)]">
                  <Database className="w-10 h-10 mx-auto mb-3 text-[var(--muted-text)]" />
                  <p>暂无关系数据</p>
                  <p className="text-xs mt-1">该对象暂未提取到关系</p>
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--muted-text)]">
                  <Users className="w-10 h-10 mx-auto mb-3 text-[var(--muted-text)]" />
                  <p>从左侧列表选择一个对象以查看关系图谱</p>
                  <p className="text-xs mt-1">推荐：比亚迪、宁德时代、蔚来</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ch-card-cut">
        <div className="ch-card-cut-inner p-4 text-xs text-[var(--muted-text)]">
          数据来源：本体抽取引擎（L3产业链库 + L5出海动态库 + L8港口物流库）。关系置信度由LLM语义推理生成。
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) {
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-[var(--muted-text)]">
        {type}
      </span>
    )
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}
