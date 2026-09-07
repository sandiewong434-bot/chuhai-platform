import re

with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'r') as f:
    content = f.read()

# Find the SourceNote in downstream tab and replace it with new content
old_text = '''          <SourceNote>
            车企销量排名已接入 C003 采集器真实数据（中汽协行业基准）。补能设施保有量已接入 C004 采集器真实数据（中国充电联盟行业基准）。NEV 销量走势已接入 C005 采集器真实数据（中汽协/EV-Volumes 行业基准）。新能源出口占比已接入 C008 采集器真实数据（海关总署/中汽协行业基准）。新能源出口目的地 TOP5 已接入 C009 采集器真实数据（海关总署行业基准）。整车出口品牌 TOP10 已接入 C010 采集器真实数据（中汽协/海关行业基准）。
          </SourceNote>'''

new_text = '''          {/* C011 整车出口总量及全球排名 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">整车出口总量及全球排名（API实时）</h3>
                {exportTotalRankLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
              </div>
              {exportTotalRankData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={exportTotalRankData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,178,216,0.1)" />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#809daf' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#809daf' }} reversed />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(96,178,216,0.15)', background: '#0a1a2b' }} />
                    <Bar yAxisId="left" dataKey="exportVolume" name="中国出口量(万辆)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="globalRank" name="全球排名" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--muted-text)]">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {/* C018 全球销量 TOP15 国家及中国品牌市占率 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">全球销量 TOP15 国家及中国品牌市占率（API实时）</h3>
                {globalSalesShareLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
              </div>
              <div className="overflow-x-auto">
                {globalSalesShareData.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(96,178,216,0.12)]">
                        <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">排名</th>
                        <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">国家</th>
                        <th className="text-right py-3 px-4 font-medium text-[var(--muted-text)]">销量（万辆）</th>
                        <th className="text-left py-3 px-4 font-medium text-[var(--muted-text)]">中国品牌</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalSalesShareData.map((row) => (
                        <tr key={row.rank} className="border-b border-[rgba(96,178,216,0.08)] ch-row-glow">
                          <td className="py-3 px-4 text-white font-medium">{row.rank}</td>
                          <td className="py-3 px-4 text-white">{row.country}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{row.sales.toFixed(1)}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {row.chinaBrands.map((brand: string) => (
                                <span key={brand} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[rgba(0,194,255,0.12)] text-[var(--cyan)]">
                                  {brand}
                                </span>
                              ))}
                              {row.chinaBrands.length === 0 && <span className="text-xs text-[var(--muted-text)]">-</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[var(--muted-text)]">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* C019 千人保有量 vs 渗透率散点图 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">千人保有量 vs 新能源渗透率（API实时）</h3>
                {penetrationLoading && <span className="text-xs text-[var(--cyan)]">加载中...</span>}
              </div>
              {penetrationData.length > 0 ? (
                <SafeECharts
                  option={{
                    tooltip: {
                      trigger: 'item',
                      formatter: (params: any) => {
                        return `${params.data[3]}<br/>千人保有量: ${params.data[0]}<br/>渗透率: ${params.data[1]}%`
                      }
                    },
                    xAxis: { name: '千人保有量(辆)', nameTextStyle: { color: '#809daf' }, axisLabel: { color: '#809daf' }, splitLine: { lineStyle: { color: 'rgba(96,178,216,0.1)' } } },
                    yAxis: { name: '渗透率(%)', nameTextStyle: { color: '#809daf' }, axisLabel: { color: '#809daf' }, splitLine: { lineStyle: { color: 'rgba(96,178,216,0.1)' } } },
                    series: [{
                      type: 'scatter',
                      symbolSize: (data: any) => Math.sqrt(data[2]) * 3,
                      data: penetrationData.map(d => [d.ownership, d.penetration, d.ownership, d.country]),
                      itemStyle: {
                        color: (params: any) => {
                          const penetration = params.data[1]
                          return penetration >= 60 ? '#10b981' : penetration >= 30 ? '#3b82f6' : '#f59e0b'
                        },
                        shadowBlur: 10,
                        shadowColor: 'rgba(0,194,255,0.3)'
                      }
                    }]
                  }}
                  style={{ height: 400, width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-[var(--muted-text)]">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <SourceNote>
            车企销量排名已接入 C003 采集器真实数据（中汽协行业基准）。补能设施保有量已接入 C004 采集器真实数据（中国充电联盟行业基准）。NEV 销量走势已接入 C005 采集器真实数据（中汽协/EV-Volumes 行业基准）。新能源出口占比已接入 C008 采集器真实数据（海关总署/中汽协行业基准）。新能源出口目的地 TOP5 已接入 C009 采集器真实数据（海关总署行业基准）。整车出口品牌 TOP10 已接入 C010 采集器真实数据（中汽协/海关行业基准）。整车出口总量及全球排名已接入 C011 采集器真实数据（海关总署/OICA 行业基准）。全球销量 TOP15 国家及中国品牌市占率已接入 C018 采集器真实数据（EV-Volumes/彭博 NEF 行业基准）。千人保有量 vs 渗透率散点图已接入 C019 采集器真实数据（OICA/世界银行/IEA 行业基准）。
          </SourceNote>'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'w') as f:
        f.write(content)
    print("File updated successfully")
else:
    print("Old text not found")
    # Let's find what we have
    import re
    matches = list(re.finditer(r'<SourceNote>', content))
    print(f"Found {len(matches)} SourceNote tags")
    for i, m in enumerate(matches):
        start = max(0, m.start() - 50)
        end = min(len(content), m.end() + 200)
        print(f"Match {i}: ...{content[start:end]}...")
