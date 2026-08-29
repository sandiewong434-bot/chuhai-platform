import { useRef, useEffect } from 'react'

interface GlobeCanvasProps {
  width?: number
  height?: number
  className?: string
}

export default function GlobeCanvas({ width = 400, height = 300, className }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = width * 0.52
    const cy = height * 0.52
    const r = Math.min(height * 0.44, width * 0.24)

    const nodes = [
      [-.68, -.26, '#8ee8bb'],
      [-.42, .2, '#61ebf0'],
      [-.1, -.48, '#d7b777'],
      [.13, .2, '#8ee8bb'],
      [.42, -.18, '#61ebf0'],
      [.57, .15, '#8ee8bb'],
      [.28, .47, '#d7b777'],
    ] as const

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // 背景渐变球
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      const g = ctx.createRadialGradient(cx - r * .34, cy - r * .38, r * .04, cx, cy, r)
      g.addColorStop(0, 'rgba(74,209,224,.96)')
      g.addColorStop(.32, 'rgba(20,119,151,.94)')
      g.addColorStop(.73, 'rgba(4,43,69,.97)')
      g.addColorStop(1, 'rgba(2,13,25,1)')
      ctx.fillStyle = g
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      // 扫描光效
      const rot = t * .00016
      const sweep = ctx.createConicGradient(rot, cx, cy)
      sweep.addColorStop(0, 'rgba(111,238,244,0)')
      sweep.addColorStop(.045, 'rgba(111,238,244,.16)')
      sweep.addColorStop(.09, 'rgba(111,238,244,0)')
      sweep.addColorStop(1, 'rgba(111,238,244,0)')
      ctx.fillStyle = sweep
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      // 纬线
      ctx.strokeStyle = 'rgba(135,238,246,.22)'
      ctx.lineWidth = .65
      for (let a = -.78; a <= .78; a += .19) {
        const rr = r * Math.sqrt(1 - a * a)
        ctx.beginPath()
        ctx.ellipse(cx, cy + a * r, rr, r * .105, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 经线
      for (let k = -5; k <= 5; k++) {
        const skew = Math.sin(rot + k * .18) * .16
        ctx.beginPath()
        ctx.ellipse(cx, cy, r * (.12 + Math.abs(k) * .04), r, Math.PI / 2 + skew, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 辐射线
      ctx.strokeStyle = 'rgba(147,247,251,.1)'
      for (let i = 0; i < 24; i++) {
        const a = rot + i * .55
        const x = cx + Math.cos(a) * r * .75
        const y = cy + Math.sin(a * 1.7) * r * .48
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      // 节点
      const nodePoints = nodes.map(([nx, ny, col], i) => ({
        x: cx + Math.sin(nx * 4 + rot) * r * .74,
        y: cy + ny * r,
        col,
        i,
      }))

      ctx.lineWidth = .8
      for (let i = 0; i < nodePoints.length - 1; i++) {
        const a = nodePoints[i]
        const b = nodePoints[(i + 2) % nodePoints.length]
        ctx.strokeStyle = 'rgba(112,236,241,.32)'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - r * .15, b.x, b.y)
        ctx.stroke()
      }

      nodePoints.forEach(({ x, y, col, i }) => {
        const pulse = 3 + Math.sin(t * .004 + i) * 1.1
        ctx.fillStyle = col
        ctx.shadowColor = col
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(x, y, pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      ctx.restore()
      t++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [width, height])

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
