import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6" style={{ background: '#06111e' }}>
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.2)' }}>
              <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              页面加载出错
            </h3>
            <p className="text-sm text-[var(--muted-text)] mb-4">
              {this.state.error?.message || '发生了未知错误，请稍后重试'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm rounded-md transition-colors"
              style={{ background: 'rgba(0,194,255,0.12)', border: '1px solid rgba(0,194,255,0.2)' }}
            >
              <RefreshCw className="w-4 h-4" />
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
