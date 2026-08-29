interface SvgLineChartProps {
  points?: number[]
  width?: number
  height?: number
  className?: string
}

export default function SvgLineChart({
  points = [180, 148, 162, 126, 135, 98, 113, 75, 88, 52, 66, 35],
  width = 720,
  height = 210,
  className,
}: SvgLineChartProps) {
  const step = 652 / (points.length - 1)
  const left = 48
  const right = 700
  const coords = points.map((p, i) => `${left + i * step},${p}`).join(' L')
  const labels = ['01月', '03月', '05月', '07月', '09月', '11月']
  const lastVal = Math.round(100 - (points[points.length - 1] || 35) / 2)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#61ebf0" stopOpacity=".34" />
          <stop offset="1" stopColor="#61ebf0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chartLine" x1="0" x2="1">
          <stop stopColor="#58cddd" />
          <stop offset=".63" stopColor="#61ebf0" />
          <stop offset="1" stopColor="#8ee8bb" />
        </linearGradient>
      </defs>
      
      {/* 网格 */}
      <g opacity="0.3">
        <path d="M48 22H700M48 72H700M48 122H700M48 172H700" stroke="rgba(140,210,222,.23)" strokeWidth="1" />
        <path d="M48 16V180M700 16V180" stroke="rgba(140,210,222,.23)" strokeWidth="1" />
      </g>
      
      {/* Y轴标签 */}
      <g fill="#84a8b1" fontSize="10" fontFamily="ui-monospace">
        <text x="4" y="26">100</text>
        <text x="12" y="76">75</text>
        <text x="12" y="126">50</text>
        <text x="12" y="176">25</text>
      </g>
      
      {/* X轴标签 */}
      <g fill="#84a8b1" fontSize="10" fontFamily="ui-monospace">
        {labels.map((x, i) => (
          <text key={x} x={left + i * (right - left) / 5} y="200" textAnchor="middle">{x}</text>
        ))}
      </g>
      
      {/* 面积 */}
      <path
        fill="url(#chartFill)"
        d={`M${left} ${points[0]} L${coords} V180H${left}Z`}
      />
      
      {/* 线条 */}
      <path
        fill="none"
        stroke="url(#chartLine)"
        strokeWidth="2"
        d={`M${left} ${points[0]} L${coords}`}
      />
      
      {/* 终点高亮 */}
      <circle cx={right} cy={points[points.length - 1]} r="5" fill="#061827" stroke="#8ee8bb" strokeWidth="3" />
      
      {/* 数值标签 */}
      <g transform={`translate(${right - 4} ${Math.max(20, (points[points.length - 1] || 35) - 16)})`}>
        <rect x="-35" y="-12" width="35" height="15" fill="#102a36" stroke="#61ebf0" strokeOpacity="0.5" rx="2" />
        <text x="-17" y="-2" textAnchor="middle" fill="#d9feff" fontSize="10" fontFamily="ui-monospace">{lastVal}</text>
      </g>
    </svg>
  )
}
