import React from 'react'

type Props = { data: number[]; width?: number; height?: number; color?: string }

const LineChart: React.FC<Props> = ({ data, width = 600, height = 160, color = '#0b76ff' }) => {
  if (!data || data.length === 0) return <div style={{padding:12}}>No data</div>

  const max = Math.max(...data)
  const min = Math.min(...data)
  const padding = 12
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const stepX = innerW / (data.length - 1)

  const points = data.map((v, i) => {
    const x = padding + i * stepX
    // normalize value to [0..1]
    const t = max === min ? 0.5 : (v - min) / (max - min)
    const y = padding + (1 - t) * innerH
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i===0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')

  // area path for subtle fill
  const areaD = `${pathD} L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`

  // small circles
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        <path d={areaD} fill="url(#gradArea)" stroke="none" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.25} fill="#fff" stroke={color} strokeWidth={2} />
        ))}
      </g>
    </svg>
  )
}

export default LineChart
