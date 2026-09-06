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
  enterprise: '#00c2ff',
  country_region: '#3ce6b4',
  product_item: '#a855f7',
  industrial_chain_segment: '#facc15',
  port_logistics: '#f472b6',
}

const REL_COLORS: Record<string, string> = {
  'rel-01-overseas_invest': '#00c2ff',
  'rel-02-overseas_biz': '#3ce6b4',
  'rel-03-trade_barrier': '#f472b6',
  'rel-04-risk_impact': '#ef4444',
  '海外投资': '#00c2ff',
  '海外经营': '#3ce6b4',
  '贸易壁垒': '#f472b6',
  '风险影响': '#ef4444',
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
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })

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

  // 计算与悬停节点相关的边
  const relatedEdges = useCallback((nodeId: string | null) => {
    if (!nodeId) return new Set<string>()
    const set = new Set<string>()
    edges.forEach((e, i) => {
      if (e.source === nodeId || e.target === nodeId) {
        set.add(i.toString())
      }
    })
    return set
  }, [edges])

  // 力导向模拟 + 绘制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let simTicks = 0
    const maxTicks = 300
    const relSet = relatedEdges(hoveredNode)

    const simulate = () => {
      const nodeMap = new Map(nodeRef.current.map((n) => [n.id, n]))
      const w = width
      const h = height

      // 力导向迭代
      for (let i = 0; i < 5; i++) {
        if (simTicks >= maxTicks) break
        simTicks++

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

        nodeRef.current.forEach((n) => {
          const dx = w / 2 - n.x
          const dy = h / 2 - n.y
          n.vx += dx * 0.0005
          n.vy += dy * 0.0005
        })

        nodeRef.current.forEach((n) => {
          n.vx *= 0.9
          n.vy *= 0.9
          n.x += n.vx
          n.y += n.vy
          const margin = 30
          n.x = Math.max(margin, Math.min(w - margin, n.x))
          n.y = Math.max(margin, Math.min(h - margin, n.y))
        })
      }

      // 绘制
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(offset.x, offset.y)
      ctx.scale(scale, scale)

      // 绘制边
      edges.forEach((e, idx) => {
        const na = nodeMap.get(e.source)
        const nb = nodeMap.get(e.target)
        if (!na || !nb) return

        const isRelated = hoveredNode && relSet.has(idx.toString())
        const isDimmed = hoveredNode && !isRelated

        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = isRelated
          ? (REL_COLORS[e.type] || '#00c2ff')
          : isDimmed
            ? 'rgba(96,178,216,0.08)'
            : 'rgba(96,178,216,0.2)'
        ctx.lineWidth = isRelated ? 2.5 : 1.2
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
        ctx.strokeStyle = isRelated
          ? (REL_COLORS[e.type] || '#00c2ff')
          : isDimmed
            ? 'rgba(96,178,216,0.08)'
            : 'rgba(96,178,216,0.3)'
        ctx.lineWidth = isRelated ? 2 : 1
        ctx.stroke()

        // 关系标签（仅相关边或无边悬停时显示）
        if (!hoveredNode || isRelated) {
          const midX = (na.x + nb.x) / 2
          const midY = (na.y + nb.y) / 2
          ctx.fillStyle = isRelated ? '#eaf8ff' : 'rgba(128,157,175,0.6)'
          ctx.font = isRelated ? 'bold 10px sans-serif' : '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(e.type, midX, midY - 4)
        }
      })

      // 绘制节点
      nodeRef.current.forEach((n) => {
        const isCenter = n.id === centerNode
        const isHovered = n.id === hoveredNode
        const isNeighbor = hoveredNode && edges.some(
          (e) => (e.source === hoveredNode && e.target === n.id) ||
                 (e.target === hoveredNode && e.source === n.id)
        )
        const isDimmed = hoveredNode && !isHovered && !isNeighbor && n.id !== hoveredNode
        const color = TYPE_COLORS[n.type] || '#6b7280'
        const radius = isCenter ? 22 : 16
        const alpha = isDimmed ? 0.25 : 1

        ctx.globalAlpha = alpha

        // 外发光（悬停或邻居）
        if (isHovered || isNeighbor) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, radius + 10, 0, Math.PI * 2)
          ctx.fillStyle = color + '18'
          ctx.fill()
        }

        // 节点圆圈
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius + (isHovered ? 3 : 0), 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // 中心节点外圈
        if (isCenter) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, radius + 6, 0, Math.PI * 2)
          ctx.strokeStyle = color + '88'
          ctx.lineWidth = 3
          ctx.stroke()
        }

        // 节点文字
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${isCenter ? 12 : 10}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.id.length > 5 ? n.id.slice(0, 4) + '...' : n.id, n.x, n.y - 2)

        // 类型小字
        ctx.fillStyle = '#ffffffcc'
        ctx.font = '8px sans-serif'
        ctx.fillText(n.type, n.x, n.y + 10)

        ctx.globalAlpha = 1
      })

      ctx.restore()

      if (simTicks < maxTicks) {
        animId = requestAnimationFrame(simulate)
      }
    }

    simulate()

    return () => cancelAnimationFrame(animId)
  }, [nodes, edges, width, height, hoveredNode, centerNode, scale, offset, relatedEdges])

  // 坐标变换：屏幕 -> 画布内部
  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale,
    }
  }, [offset, scale])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const pos = screenToWorld(sx, sy)

      if (isPanning) {
        setOffset({
          x: offsetRef.current.x + (e.clientX - panStart.current.x),
          y: offsetRef.current.y + (e.clientY - panStart.current.y),
        })
        return
      }

      if (draggingNode) {
        const node = nodeRef.current.find((n) => n.id === draggingNode)
        if (node) {
          node.x = pos.x
          node.y = pos.y
          node.vx = 0
          node.vy = 0
        }
        return
      }

      let found: string | null = null
      for (const n of nodeRef.current) {
        const dx = pos.x - n.x
        const dy = pos.y - n.y
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          found = n.id
          break
        }
      }
      setHoveredNode(found)
    },
    [draggingNode, isPanning, screenToWorld]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)

      for (const n of nodeRef.current) {
        const dx = pos.x - n.x
        const dy = pos.y - n.y
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setDraggingNode(n.id)
          return
        }
      }

      // 没有点到节点，开始平移
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY }
      offsetRef.current = { ...offset }
    },
    [screenToWorld, offset]
  )

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
    setIsPanning(false)
    offsetRef.current = { ...offset }
  }, [offset])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (hoveredNode && onNodeClick && !isPanning) {
        onNodeClick(hoveredNode)
      }
    },
    [hoveredNode, onNodeClick, isPanning]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const pos = screenToWorld(sx, sy)

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(3, Math.max(0.3, scale * delta))

      setScale(newScale)
      setOffset({
        x: sx - pos.x * newScale,
        y: sy - pos.y * newScale,
      })
      offsetRef.current = {
        x: sx - pos.x * newScale,
        y: sy - pos.y * newScale,
      }
    },
    [scale, screenToWorld]
  )

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full cursor-grab active:cursor-grabbing"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  )
}
