import { Component, ReactNode, useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error?: Error
  showDetails: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="min-h-[400px] flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0d1f33 0%, #06111e 100%)' }}
        >
          <div className="text-center max-w-lg w-full">
            {/* Alert icon with glow */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{
                background: 'rgba(255,77,109,0.15)',
                border: '2px solid rgba(255,77,109,0.35)',
                boxShadow: '0 0 30px rgba(255,77,109,0.25)',
              }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#ff4d6d' }} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {this.props.label ? `${this.props.label} 加载出错` : '页面加载出错'}
            </h3>

            {/* Description */}
            <p className="text-sm mb-5" style={{ color: '#809daf' }}>
              {this.state.error?.message || '发生了未知错误，请稍后重试'}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                  window.location.reload()
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all"
                style={{
                  background: 'rgba(0,194,255,0.15)',
                  border: '1px solid rgba(0,194,255,0.35)',
                  boxShadow: '0 0 20px rgba(0,194,255,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,194,255,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,194,255,0.15)'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </button>

              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
                style={{
                  color: '#809daf',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(96,178,216,0.15)',
                }}
              >
                <Bug className="w-4 h-4" />
                错误详情
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Error details */}
            {this.state.showDetails && (
              <div
                className="mt-4 text-left rounded-lg p-4 text-xs font-mono overflow-auto"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,77,109,0.2)',
                  color: '#ff8fa3',
                  maxHeight: 200,
                }}
              >
                <div className="font-semibold mb-1" style={{ color: '#ff4d6d' }}>Error: {this.state.error?.name}</div>
                <div className="mb-2">{this.state.error?.message}</div>
                {this.state.error?.stack && (
                  <pre className="whitespace-pre-wrap text-[10px] opacity-70">{this.state.error.stack}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useSafeRender<T>(factory: () => T, deps: unknown[]): T | null {
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      setResult(factory())
      setError(null)
    } catch (e) {
      console.error('[useSafeRender] Error:', e)
      setError(e as Error)
      setResult(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  if (error) {
    return null
  }

  return result
}
