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
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              页面加载出错
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || '发生了未知错误，请稍后重试'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
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
