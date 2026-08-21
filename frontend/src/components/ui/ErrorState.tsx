export default function ErrorState({ message = '加载失败，请稍后重试' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="text-4xl mb-2">⚠️</div>
      <span className="text-sm">{message}</span>
    </div>
  )
}
