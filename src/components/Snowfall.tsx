'use client'

import { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  animationDuration: number
  animationDelay: number
  size: number
}

export default function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    const flakes: Snowflake[] = []
    for (let i = 0; i < 35; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 12 + Math.random() * 8,
        animationDelay: Math.random() * 15,
        size: 8 + Math.random() * 12,
      })
    }
    setSnowflakes(flakes)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            fontSize: `${flake.size}px`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  )
}
