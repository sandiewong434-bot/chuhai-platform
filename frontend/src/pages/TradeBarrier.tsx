import { useState } from 'react'
import { ShieldAlert, Search, Filter, AlertTriangle } from 'lucide-react'

// 演示数据
const DEMO_CASES = [
  {
    id: 1,
    title: '欧盟对中国电动汽车发起反补贴调查',
    country: '欧盟',
    type: '反补贴调查',
    status: '进行中',
    date: '2023-10-04',
    nev_related: true,
    description: '欧盟委员会宣布对进口自中国的电动汽车发起反补贴调查，涉及比亚迪、上汽、吉利等品牌。',
  },
  {
    id: 2,
    title: '美国对华301关税复审',
    country: '美国',
    type: '关税措施',
    status: '复审中',
    date: '2024-05-14',
    nev_related: true,
    description: '美国贸易代表办公室启动对华301关税的法定四年复审程序，涉及约3700亿美元中国商品。',
  },
  {
    id: 3,
    title: '土耳其对中国进口汽车加征40%关税',
    country: '土耳其',
    type: '关税措施',
    status: '已生效',
    date: '2024-06-08',
    nev_related: true,
    description: '土耳其宣布对从中国进口的汽车加征40%的额外关税，以保护本国汽车产业。',
  },
  {
    id: 4,
    title: '印度对中国光伏产品发起反倾销调查',
    country: '印度',
    type: '反倾销调查',
    status: '立案',
    date: '2024-03-15',
    nev_related: false,
    description: '印度商工部对华光伏电池及组件发起反倾销调查，涉及多家中国企业。',
  },
  {
    id: 5,
    title: '巴西恢复对新能源汽车进口关税',
    country: '巴西',
    type: '关税调整',
    status: '已生效',
    date: '2024-01-01',
    nev_related: true,
    description: '巴西恢复对进口新能源汽车征收18%的工业产品税(IPI)，此前享受免税政策。',
  },
]

export default function TradeBarrier() {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [onlyNEV, setOnlyNEV] = useState(false)

  const filtered = DEMO_CASES.filter((c) => {
    if (q && !c.title.includes(q) && !c.country.includes(q)) return false
    if (typeFilter && c.type !== typeFilter) return false
    if (statusFilter && c.status !== statusFilter) return false
    if (onlyNEV && !c.nev_related) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">贸易壁垒</h2>
        <p className="text-gray-500 mt-1">贸易救济案件查询与 NEV 高亮</p>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索案件或国家..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={() => { setQ(''); setTypeFilter(''); setStatusFilter(''); setOnlyNEV(false) }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部类型</option>
            <option value="反补贴调查">反补贴调查</option>
            <option value="反倾销调查">反倾销调查</option>
            <option value="关税措施">关税措施</option>
            <option value="关税调整">关税调整</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部状态</option>
            <option value="进行中">进行中</option>
            <option value="已生效">已生效</option>
            <option value="复审中">复审中</option>
            <option value="立案">立案</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={onlyNEV}
              onChange={(e) => setOnlyNEV(e.target.checked)}
              className="rounded"
            />
            仅 NEV 相关
          </label>
        </div>
      </div>

      {/* 案件列表 */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-lg border p-5 ${
              c.nev_related ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {c.title}
                  </h3>
                  {c.nev_related && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      NEV
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    {c.country}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    {c.type}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded">
                    {c.status}
                  </span>
                  <span className="text-gray-400">{c.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">无匹配案件</div>
        )}
      </div>
    </div>
  )
}
