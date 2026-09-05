import { useRef, useEffect, useCallback, useState } from 'react'

interface GraphNode {
  id: string
  type: string
  x?: number
  y?: number
}

interface GraphEdge {
  source: string
  target: string
  type: string
  confidence?: string | null
}

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width?: number
  height?: number
  onNodeClick?: (nodeId: string) => void
  centerNode?: string
}

const TYPE_COLORS: Record<string, string> = {
  enterprise: '#2563eb',
  country_region: '#16a34a',
  product_item: '#9333ea',
  industrial_chain_segment: '#facc15',
  port_logistics: '#f472b6',
}

export default function ForceGraph({
  nodes,
  edges,
  width = 600,
  height = 400,
  onNodeClick,
  centerNode,
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)

  // 初始化节点位置
  const initPositions = useCallback(() => {
    const w = width
    const h = height
    return nodes.map((n) => ({
      ...n,
      x: n.x ?? w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: n.y ?? h / 2 + (Math.random() - 0.5) * h * 0.6,
      vx: 0,
      vy: 0,
    }))
  }, [nodes, width, height])

  const nodeRef = useRef(initPositions())

  useEffect(() => {
    nodeRef.current = initPositions()
  }, [initPositions])

  // 力导向模拟
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let simTicks = 0
    const maxTicks = 300

    const simulate = () => {
      const nodeMap = new Map(nodeRef.current.map((n) => [n.id, n]))
      const w = width
      const h = height

      // 力导向迭代
      for (let i = 0; i < 5; i++) {
        if (simTicks >= maxTicks) break
        simTicks++

        // 1. 节点间斥力
        for (let a = 0; a < nodeRef.current.length; a++) {
          for (let b = a + 1; b < nodeRef.current.length; b++) {
            const na = nodeRef.current[a]
            const nb = nodeRef.current[b]
            const dx = na.x - nb.x
            const dy = na.y - nb.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = (4000 / (dist * dist)) * 0.5
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            na.vx += fx
            na.vy += fy
            nb.vx -= fx
            nb.vy -= fy
          }
        }

        // 2. 边引力
        edges.forEach((e) => {
          const na = nodeMap.get(e.source)
          const nb = nodeMap.get(e.target)
          if (!na || !nb) return
          const dx = nb.x - na.x
          const dy = nb.y - na.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const targetDist = 120
          const force = ((dist - targetDist) / targetDist) * 0.03
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          na.vx += fx
          na.vy += fy
          nb.vx -= fx
          nb.vy -= fy
        })

        // 3. 中心引力
        nodeRef.current.forEach((n) => {
          const dx = w / 2 - n.x
          const dy = h / 2 - n.y
          n.vx += dx * 0.0005
          n.vy += dy * 0.0005
        })

        // 4. 更新位置 + 阻尼
        nodeRef.current.forEach((n) => {
          n.vx *= 0.9
          n.vy *= 0.9
          n.x += n.vx
          n.y += n.vy

          // 边界约束
          const margin = 30
          n.x = Math.max(margin, Math.min(w - margin, n.x))
          n.y = Math.max(margin, Math.min(h - margin, n.y))
        })
      }

      // 绘制
      ctx.clearRect(0, 0, w, h)

      // 绘制边
      edges.forEach((e) => {
        const na = nodeMap.get(e.source)
        const nb = nodeMap.get(e.target)
        if (!na || !nb) return

        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 箭头
        const dx = nb.x - na.x
        const dy = nb.y - na.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const arrowLen = 8
        const arrowAngle = Math.PI / 6
        const endX = nb.x - (dx / dist) * 22
        const endY = nb.y - (dy / dist) * 22
        const angle = Math.atan2(dy, dx)

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowLen * Math.cos(angle - arrowAngle),
          endY - arrowLen * Math.sin(angle - arrowAngle)
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowLen * Math.cos(angle + arrowAngle),
          endY - arrowLen * Math.sin(angle + arrowAngle)
        )
        ctx.strokeStyle = '#9ca3af'
        ctx.lineWidth = 1
        ctx.stroke()

        // 关系标签
        const midX = (na.x + nb.x) / 2
        const midY = (na.y + nb.y) / 2
        ctx.fillStyle = '#6b7280'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(e.type, midX, midY - 4)
      })

      // 绘制节点
      nodeRef.current.forEach((n) => {
        const isCenter = n.id === centerNode
        const isHovered = n.id === hoveredNode
        const color = TYPE_COLORS[n.type] || '#6b7280'
        const radius = isCenter ? 22 : 16

        // 节点圆圈
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius + (isHovered ? 3 : 0), 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // 中心节点外圈
        if (isCenter) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, radius + 6, 0, Math.PI * 2)
          ctx.strokeStyle = color + '55'
          ctx.lineWidth = 3
          ctx.stroke()
        }

        // 节点文字
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${isCenter ? 12 : 10}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.id.slice(0, 4), n.x, n.y - 2)

        // 类型小字
        ctx.fillStyle = '#ffffffcc'
        ctx.font = '8px sans-serif'
        ctx.fillText(n.type, n.x, n.y + 10)
      })

      if (simTicks < maxTicks) {
        animId = requestAnimationFrame(simulate)
      }
    }

    simulate()

    return () => cancelAnimationFrame(animId)
  }, [nodes, edges, width, height, hoveredNode, centerNode])

  // 鼠标事件
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { e.preventDefault();
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      if (draggingNode) {
        const node = nodeRef.current.find((n) => n.id === draggingNode)
        if (node) {
          node.x = mx
          node.y = my
          node.vx = 0
          node.vy = 0
        }
        return
      }

      let found: string | null = null
      for (const n of nodeRef.current) {
        const dx = mx - n.x
        const dy = my - n.y
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          found = n.id
          break
        }
      }
      setHoveredNode(found)
    },
    [draggingNode]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { e.preventDefault();
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      for (const n of nodeRef.current) {
        const dx = mx - n.x
        const dy = my - n.y
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setDraggingNode(n.id)
          return
        }
      }
    },
    []
  )

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { e.preventDefault();
      if (hoveredNode && onNodeClick) {
        onNodeClick(hoveredNode)
      }
    },
    [hoveredNode, onNodeClick]
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full cursor-pointer"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    />
  )
}
