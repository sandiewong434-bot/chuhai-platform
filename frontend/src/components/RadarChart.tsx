import { useRef, useEffect } from 'react'

interface RadarChartProps {
  values: number[]
  labels?: string[]
  width?: number
  height?: number
  className?: string
}

export default function RadarChart({
  values,
  labels = ['现金流', '供应链', '产能', '意愿', '数字化'],
  width = 280,
  height = 220,
  className,
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = width / 2
    const cy = height / 2
    const r = Math.min(width, height) * .34
    const n = values.length

    ctx.clearRect(0, 0, width, height)

    // 网格
    for (let l = 1; l <= 5; l++) {
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const angle = i * 2 * Math.PI / n - Math.PI / 2
        const px = cx + Math.cos(angle) * r * l / 5
        const py = cy + Math.sin(angle) * r * l / 5
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(81,157,185,.28)'
      ctx.stroke()
    }

    // 数据区域
    ctx.beginPath()
    values.forEach((v, i) => {
      const angle = i * 2 * Math.PI / n - Math.PI / 2
      const px = cx + Math.cos(angle) * r * v / 100
      const py = cy + Math.sin(angle) * r * v / 100
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,194,255,.24)'
    ctx.fill()
    ctx.strokeStyle = '#3ce6b4'
    ctx.lineWidth = 2
    ctx.stroke()

    // 标签
    labels.forEach((name, i) => {
      const angle = i * 2 * Math.PI / n - Math.PI / 2
      const px = cx + Math.cos(angle) * r * 1.22
      const py = cy + Math.sin(angle) * r * 1.22
      ctx.fillStyle = '#a5c9d7'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(name, px, py)
    })
  }, [values, labels, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ width, height }}
    />
  )
}
