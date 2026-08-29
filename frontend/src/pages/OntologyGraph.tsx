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
}

interface GraphData {
  center: string
  nodes: { id: string; type: string }[]
  edges: { source: string; target: string; type: string; confidence: string | null }[]
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: typeof Factory }> = {
  '企业': { color: '#00c2ff', bg: 'bg-[rgba(0,194,255,0.08)] text-[var(--cyan)]', icon: Factory },
  '目的国': { color: '#3ce6b4', bg: 'bg-[rgba(60,230,180,0.08)] text-[var(--teal)]', icon: Globe },
  '产品': { color: '#a855f7', bg: 'bg-purple-500/10 text-purple-400', icon: Box },
  '产业链环节': { color: '#facc15', bg: 'bg-yellow-500/10 text-yellow-400', icon: Link2 },
  '港口/物流': { color: '#f472b6', bg: 'bg-[rgba(255,77,109,0.08)] text-[var(--danger)]', icon: TrendingUp },
}

// 模拟对象数据
const MOCK_OBJECTS: ObjectEntity[] = [
  { obj_id: 'e1', obj_type: '企业', name: '比亚迪', source_libraries: 'L1,L5' },
  { obj_id: 'e2', obj_type: '企业', name: '宁德时代', source_libraries: 'L1,L3' },
  { obj_id: 'e3', obj_type: '企业', name: '蔚来', source_libraries: 'L1,L5' },
  { obj_id: 'e4', obj_type: '企业', name: '小鹏', source_libraries: 'L1' },
  { obj_id: 'e5', obj_type: '企业', name: '上汽MG', source_libraries: 'L1,L5' },
  { obj_id: 'e6', obj_type: '企业', name: '极氪', source_libraries: 'L1' },
  { obj_id: 'e7', obj_type: '企业', name: '理想', source_libraries: 'L1' },
  { obj_id: 'c1', obj_type: '目的国', name: '泰国', source_libraries: 'L5,L8' },
  { obj_id: 'c2', obj_type: '目的国', name: '匈牙利', source_libraries: 'L5' },
  { obj_id: 'c3', obj_type: '目的国', name: '巴西', source_libraries: 'L5' },
  { obj_id: 'c4', obj_type: '目的国', name: '印尼', source_libraries: 'L5,L8' },
  { obj_id: 'c5', obj_type: '目的国', name: '德国', source_libraries: 'L5' },
  { obj_id: 'c6', obj_type: '目的国', name: '挪威', source_libraries: 'L5' },
  { obj_id: 'c7', obj_type: '目的国', name: '阿联酋', source_libraries: 'L5' },
  { obj_id: 'p1', obj_type: '产品', name: '海豹', source_libraries: 'L1' },
  { obj_id: 'p2', obj_type: '产品', name: '海豚', source_libraries: 'L1' },
  { obj_id: 'p3', obj_type: '产品', name: 'ET5', source_libraries: 'L1' },
  { obj_id: 'p4', obj_type: '产品', name: 'MG4', source_libraries: 'L1' },
  { obj_id: 'p5', obj_type: '产品', name: '麒麟电池', source_libraries: 'L3' },
  { obj_id: 'p6', obj_type: '产品', name: '神行电池', source_libraries: 'L3' },
  { obj_id: 'ch1', obj_type: '产业链环节', name: '电池Pack', source_libraries: 'L3' },
  { obj_id: 'ch2', obj_type: '产业链环节', name: '电机电控', source_libraries: 'L3' },
  { obj_id: 'ch3', obj_type: '产业链环节', name: '智能驾驶', source_libraries: 'L3' },
  { obj_id: 'ch4', obj_type: '产业链环节', name: '车身冲压', source_libraries: 'L3' },
  { obj_id: 'po1', obj_type: '港口/物流', name: '鹿特丹港', source_libraries: 'L8' },
  { obj_id: 'po2', obj_type: '港口/物流', name: '林查班港', source_libraries: 'L8' },
  { obj_id: 'po3', obj_type: '港口/物流', name: '汉堡港', source_libraries: 'L8' },
]

// 模拟图谱数据
const MOCK_GRAPHS: Record<string, GraphData> = {
  '比亚迪': {
    center: '比亚迪',
    nodes: [
      { id: '比亚迪', type: '企业' },
      { id: '泰国', type: '目的国' }, { id: '巴西', type: '目的国' },
      { id: '匈牙利', type: '目的国' }, { id: '印尼', type: '目的国' },
      { id: '海豹', type: '产品' }, { id: '海豚', type: '产品' },
      { id: '电池Pack', type: '产业链环节' }, { id: '鹿特丹港', type: '港口/物流' },
    ],
    edges: [
      { source: '比亚迪', target: '泰国', type: '投资建厂', confidence: '0.95' },
      { source: '比亚迪', target: '巴西', type: '投资建厂', confidence: '0.90' },
      { source: '比亚迪', target: '匈牙利', type: '投资建厂', confidence: '0.92' },
      { source: '比亚迪', target: '印尼', type: '战略合作', confidence: '0.85' },
      { source: '比亚迪', target: '海豹', type: '生产', confidence: '0.98' },
      { source: '比亚迪', target: '海豚', type: '生产', confidence: '0.98' },
      { source: '比亚迪', target: '电池Pack', type: '自研', confidence: '0.95' },
      { source: '鹿特丹港', target: '比亚迪', type: '物流通道', confidence: '0.80' },
    ],
  },
  '宁德时代': {
    center: '宁德时代',
    nodes: [
      { id: '宁德时代', type: '企业' },
      { id: '匈牙利', type: '目的国' }, { id: '德国', type: '目的国' },
      { id: '印尼', type: '目的国' },
      { id: '麒麟电池', type: '产品' }, { id: '神行电池', type: '产品' },
      { id: '电池Pack', type: '产业链环节' },
    ],
    edges: [
      { source: '宁德时代', target: '匈牙利', type: '投资建厂', confidence: '0.95' },
      { source: '宁德时代', target: '德国', type: '出口', confidence: '0.88' },
      { source: '宁德时代', target: '印尼', type: '全产业链投资', confidence: '0.90' },
      { source: '宁德时代', target: '麒麟电池', type: '生产', confidence: '0.99' },
      { source: '宁德时代', target: '神行电池', type: '生产', confidence: '0.99' },
      { source: '宁德时代', target: '电池Pack', type: '供应', confidence: '0.95' },
    ],
  },
  '蔚来': {
    center: '蔚来',
    nodes: [
      { id: '蔚来', type: '企业' },
      { id: '挪威', type: '目的国' }, { id: '德国', type: '目的国' },
      { id: '阿联酋', type: '目的国' },
      { id: 'ET5', type: '产品' },
      { id: '智能驾驶', type: '产业链环节' },
      { id: '汉堡港', type: '港口/物流' },
    ],
    edges: [
      { source: '蔚来', target: '挪威', type: '出口+换电站', confidence: '0.92' },
      { source: '蔚来', target: '德国', type: '出口', confidence: '0.88' },
      { source: '蔚来', target: '阿联酋', type: '区域总部', confidence: '0.85' },
      { source: '蔚来', target: 'ET5', type: '生产', confidence: '0.98' },
      { source: '蔚来', target: '智能驾驶', type: '自研', confidence: '0.90' },
      { source: '汉堡港', target: '蔚来', type: '物流通道', confidence: '0.82' },
    ],
  },
}

export default function OntologyGraph() {
  const [q, setQ] = useState('')
  const [selectedObj, setSelectedObj] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')

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
        return MOCK_GRAPHS[selectedObj] || { center: selectedObj, nodes: [{ id: selectedObj, type: '企业' }], edges: [] }
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

  const typeStats = objects.reduce((acc, obj) => {
    acc[obj.obj_type] = (acc[obj.obj_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG['企业']
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
                  <span className="text-xs text-[var(--muted-text)]">{type}</span>
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
                    onClick={() => setSelectedObj(obj.name)}
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

        {/* 关系图谱 */}
        <div className="lg:col-span-2 ch-card-cut">
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
                        <span className="text-xs text-[var(--muted-text)]">{t}</span>
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
                      edges={graph.edges}
                      width={700}
                      height={350}
                      centerNode={graph.center}
                      onNodeClick={(nodeId) => setSelectedObj(nodeId)}
                    />
                  </div>
                </div>

                {/* 关系列表明细 */}
                <div>
                  <h4 className="text-sm font-medium text-[var(--muted-text)] mb-2 flex items-center gap-2">
                    <div className="ch-title-bar" />
                    <Link2 className="w-3.5 h-3.5" />
                    关系明细 ({graph.edges.length}条)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {graph.edges.map((edge, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm px-3 py-2 bg-white/5 rounded hover:bg-white/5 transition-colors"
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
      {type}
    </span>
  )
}
