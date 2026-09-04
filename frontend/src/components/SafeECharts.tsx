import { useState, useEffect, Component, type ReactNode } from 'react'
import ReactECharts from 'echarts-for-react'
import { AlertTriangle, BarChart3 } from 'lucide-react'

interface SafeEChartsProps {
  option: Record<string, unknown>
  style?: React.CSSProperties
  onEvents?: Record<string, (params: unknown) => void>
  className?: string
  opts?: Record<string, unknown>
}

// Wrapper that catches echarts rendering errors
export function SafeECharts({ option, style, onEvents, className, opts }: SafeEChartsProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setHasError(false)
    setErrorMsg('')
  }, [option])

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center ${className || ''}`}
        style={{
          ...style,
          background: 'rgba(10,26,43,0.6)',
          border: '1px dashed rgba(255,77,109,0.3)',
          borderRadius: 8,
        }}
      >
        <div className="text-center p-6">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#ff4d6d' }} />
          <p className="text-sm font-medium" style={{ color: '#ff8fa3' }}>图表加载失败</p>
          <p className="text-xs mt-1" style={{ color: '#809daf' }}>{errorMsg || '配置错误，请检查数据'}</p>
        </div>
      </div>
    )
  }

  return (
    <ChartErrorBoundary onError={(msg) => { setHasError(true); setErrorMsg(msg) }}>
      <ReactECharts
        option={option}
        style={style}
        onEvents={onEvents}
        className={className}
        opts={opts}
      />
    </ChartErrorBoundary>
  )
}

// Inner error boundary specifically for chart components
class ChartErrorBoundary extends Component<{ children: ReactNode; onError: (msg: string) => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; onError: (msg: string) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[ChartErrorBoundary] Chart render error:', error)
    this.props.onError(error.message)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

// Safe map chart that checks if map is registered before rendering
interface SafeMapChartProps {
  mapName: string
  option: Record<string, unknown>
  style?: React.CSSProperties
  mapReady: boolean
  onEvents?: Record<string, (params: unknown) => void>
}

export function SafeMapChart({ mapName: _mapName, option, style, mapReady, onEvents }: SafeMapChartProps) {
  if (!mapReady) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          ...style,
          background: 'rgba(10,26,43,0.4)',
        }}
      >
        <div className="text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 animate-pulse" style={{ color: '#809daf' }} />
          <p className="text-sm" style={{ color: '#809daf' }}>地图加载中...</p>
        </div>
      </div>
    )
  }

  return <SafeECharts option={option} style={style} onEvents={onEvents} />
}

export default SafeECharts
