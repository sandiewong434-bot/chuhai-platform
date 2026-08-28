import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Network } from 'lucide-react'
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

const TYPE_LEGEND = [
  { type: '企业', color: '#2563eb' },
  { type: '目的国', color: '#16a34a' },
  { type: '产品', color: '#9333ea' },
]

export default function OntologyGraph() {
  const [q, setQ] = useState('')
  const [selectedObj, setSelectedObj] = useState<string | null>(null)

  const { data: objects } = useQuery<{ items?: ObjectEntity[] }>({
    queryKey: ['objects', q],
    queryFn: async () => {
      const res = await ontologyApi.objects({ q: q || undefined, size: 50 })
      return res.data
    },
  })

  const { data: graph } = useQuery<GraphData>({
    queryKey: ['graph', selectedObj],
    queryFn: async () => {
      if (!selectedObj) return { center: '', nodes: [], edges: [] }
      const res = await ontologyApi.graph(selectedObj, 1)
      return res.data
    },
    enabled: !!selectedObj,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">本体图谱</h2>
        <p className="text-gray-500 mt-1">企业、目的国、产品之间的关系网络</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索企业/国家/产品..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 对象列表 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 font-medium text-gray-900">
            对象列表
          </div>
          <div className="max-h-[500px] overflow-auto">
            {objects?.items?.map((obj) => (
              <button
                key={obj.obj_id}
                onClick={() => setSelectedObj(obj.name)}
                className={`w-full text-left px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedObj === obj.name ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {obj.name}
                  </span>
                  <TypeBadge type={obj.obj_type} />
                </div>
              </button>
            )) || (
              <div className="p-4 text-center text-gray-400 text-sm">暂无数据</div>
            )}
          </div>
        </div>

        {/* 关系图谱 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium text-gray-900">
                {selectedObj ? `${selectedObj} 的关系网络` : '请选择对象查看关系'}
              </h3>
            </div>
            {/* 图例 */}
            {graph && graph.nodes.length > 0 && (
              <div className="flex gap-3">
                {TYPE_LEGEND.map((l) => (
                  <div key={l.type} className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-xs text-gray-500">{l.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {graph && graph.nodes.length > 0 ? (
            <div className="space-y-4">
              {/* 力导向图 */}
              <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                <ForceGraph
                  nodes={graph.nodes}
                  edges={graph.edges}
                  width={700}
                  height={350}
                  centerNode={graph.center}
                  onNodeClick={(nodeId) => setSelectedObj(nodeId)}
                />
              </div>

              {/* 关系列表明细 */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">关系明细</h4>
                <div className="space-y-2">
                  {graph.edges.map((edge, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm px-3 py-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium text-gray-900">{edge.source}</span>
                      <span className="text-gray-400">→</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {edge.type}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{edge.target}</span>
                      {edge.confidence && (
                        <span className="ml-auto text-xs text-gray-400">
                          置信度: {edge.confidence}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedObj ? (
            <div className="text-center py-12 text-gray-400">暂无关系数据</div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              从左侧列表选择一个对象以查看关系图谱
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    企业: 'bg-blue-50 text-blue-700',
    目的国: 'bg-green-50 text-green-700',
    产品: 'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${styles[type] || 'bg-gray-50 text-gray-600'}`}>
      {type}
    </span>
  )
}
