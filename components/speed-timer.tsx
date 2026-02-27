'use client'

import { useEffect, useState } from 'react'
import { formatElapsed } from '@/lib/utils'

interface SpeedTimerProps {
  from: string
  to?: string | null
  className?: string
}

export function SpeedTimer({ from, to, className }: SpeedTimerProps) {
  const [display, setDisplay] = useState(formatElapsed(from, to))

  useEffect(() => {
    if (to) {
      setDisplay(formatElapsed(from, to))
      return
    }
    // Live timer if no end time
    const interval = setInterval(() => {
      setDisplay(formatElapsed(from))
    }, 1000)
    return () => clearInterval(interval)
  }, [from, to])

  return <span className={className}>{display}</span>
}
