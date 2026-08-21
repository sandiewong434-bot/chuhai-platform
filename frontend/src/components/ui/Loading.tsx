import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
