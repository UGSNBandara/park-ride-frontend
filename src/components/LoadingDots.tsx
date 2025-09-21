import React from 'react'
import './Dashboard.css'

const LoadingDots: React.FC<{ size?: number }> = ({ size = 10 }) => {
  const style: React.CSSProperties = { ['--dot-size' as any]: `${size}px` }
  return (
    <div className="loading-dots" style={style} aria-label="loading">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  )
}

export default LoadingDots
