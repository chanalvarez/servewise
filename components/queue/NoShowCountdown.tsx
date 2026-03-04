'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface NoShowCountdownProps {
  triggeredAt: string
  onExpired?: () => void
}

const FIVE_MINUTES_MS = 5 * 60 * 1000
const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function NoShowCountdown({ triggeredAt, onExpired }: NoShowCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(FIVE_MINUTES_MS)

  useEffect(() => {
    const calc = () => {
      const elapsed = Date.now() - new Date(triggeredAt).getTime()
      const left = Math.max(0, FIVE_MINUTES_MS - elapsed)
      setRemainingMs(left)
      if (left === 0) onExpired?.()
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [triggeredAt, onExpired])

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const progress = remainingMs / FIVE_MINUTES_MS
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const colorClass =
    progress > 0.5
      ? { stroke: '#4f46e5', text: 'text-indigo-600' }
      : progress > 0.25
      ? { stroke: '#f59e0b', text: 'text-amber-600' }
      : { stroke: '#ef4444', text: 'text-red-600' }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular progress ring */}
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            stroke={colorClass.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold tabular-nums ${colorClass.text}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-1.5 text-sm font-medium ${colorClass.text}`}>
        <AlertCircle className="h-4 w-4" />
        <span>Arrive within {minutes}:{seconds.toString().padStart(2, '0')}</span>
      </div>
    </div>
  )
}
