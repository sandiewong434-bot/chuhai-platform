import { AlertCircle } from 'lucide-react'

export function SourceNote({ children }: { children: string }) {
  return (
    <div className="ch-risk-bar rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-400">数据来源说明</p>
        <p className="text-sm text-amber-300 mt-1">{children}</p>
      </div>
    </div>
  )
}
